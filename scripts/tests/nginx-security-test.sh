#!/usr/bin/env bash
set -Eeuo pipefail

readonly project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly config_dir="$project_dir/infra/nginx"
readonly domain="gestao-refeitorio-ifpe.duckdns.org"
readonly container_name="gestao-nginx-security-test-$$"

fail() {
  echo "FALHA: $*" >&2
  exit 1
}

# Git Bash converte caminhos POSIX passados ao docker; isso quebraria os
# arquivos temporários criados dentro do container. No runner Linux é inócuo.
docker_exec() {
  MSYS_NO_PATHCONV=1 docker exec "$@"
}

docker_host_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1"
  else
    printf '%s' "$1"
  fi
}

command -v docker >/dev/null 2>&1 || fail "Docker é necessário"
docker info >/dev/null 2>&1 || fail "daemon Docker indisponível"
command -v openssl >/dev/null 2>&1 || fail "OpenSSL é necessário"
command -v curl >/dev/null 2>&1 || fail "curl é necessário"

image="$(sed -n 's/^[[:space:]]*image:[[:space:]]*//p' "$config_dir/docker-compose.yml" | head -n 1)"
[[ -n "$image" ]] || fail "imagem do proxy não encontrada"

tmp_dir="$(mktemp -d)"
cleanup() {
  if [[ "${KEEP_TEST_CONTAINER:-false}" == true ]]; then
    echo "Container de diagnóstico preservado: $container_name" >&2
    return
  fi
  docker rm -f "$container_name" >/dev/null 2>&1 || true
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

cert_dir="$tmp_dir/letsencrypt/live/$domain"
mkdir -p "$cert_dir"
cat > "$tmp_dir/openssl.cnf" <<EOF
[req]
distinguished_name = subject
prompt = no

[subject]
CN = $domain
EOF
openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -config "$tmp_dir/openssl.cnf" \
  -keyout "$cert_dir/privkey.pem" \
  -out "$cert_dir/fullchain.pem" >/dev/null 2>&1
chmod 0755 "$tmp_dir" "$tmp_dir/letsencrypt" "$tmp_dir/letsencrypt/live" "$cert_dir"
chmod 0644 "$cert_dir/privkey.pem" "$cert_dir/fullchain.pem"
: > "$tmp_dir/default.conf.template"

nginx_config_mount="$(docker_host_path "$config_dir/nginx.waf.conf")"
modsec_exclusions_mount="$(docker_host_path "$config_dir/modsec-exclusions.conf")"
custom_rules_mount="$(docker_host_path "$config_dir/custom-rules.conf")"
errors_mount="$(docker_host_path "$config_dir/errors")"
letsencrypt_mount="$(docker_host_path "$tmp_dir/letsencrypt")"
default_template_mount="$(docker_host_path "$tmp_dir/default.conf.template")"

MSYS_NO_PATHCONV=1 docker run -d --name "$container_name" \
  -e MODSEC_RULE_ENGINE=On \
  -e PARANOIA=1 \
  -e 'ALLOWED_METHODS=GET HEAD POST OPTIONS PUT PATCH DELETE' \
  -e MODSEC_REQ_BODY_LIMIT=6291456 \
  -e MODSEC_AUDIT_LOG_FORMAT=JSON \
  -e MODSEC_AUDIT_LOG_PARTS=AHZ \
  -e 'RESOLVER_CONFIG=valid=10s ipv6=off' \
  -v "$nginx_config_mount:/etc/nginx/conf.d/gestao.conf:ro" \
  -v "$modsec_exclusions_mount:/etc/modsecurity.d/owasp-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf:ro" \
  -v "$custom_rules_mount:/etc/modsecurity.d/owasp-crs/rules/REQUEST-910-GESTAO-CUSTOM-RULES.conf:ro" \
  -v "$errors_mount:/etc/nginx/error-pages:ro" \
  -v "$letsencrypt_mount:/etc/letsencrypt:ro" \
  -v "$default_template_mount:/etc/nginx/templates/conf.d/default.conf.template:ro" \
  "$image" >/dev/null

base="https://${domain}:8443"
resolve=(--resolve "${domain}:8443:127.0.0.1")
for _ in {1..30}; do
  if docker_exec "$container_name" curl -ksS "${resolve[@]}" "$base/healthz" 2>/dev/null | grep -Fixq ok; then
    break
  fi
  sleep 1
done
docker_exec "$container_name" curl -ksS "${resolve[@]}" "$base/healthz" | grep -Fixq ok \
  || { docker logs "$container_name" >&2; fail "proxy não ficou pronto"; }

headers="$tmp_dir/headers"
body="$tmp_dir/body"
request() {
  local status
  status="$(docker_exec "$container_name" curl -ksS --path-as-is "${resolve[@]}" \
    -D /tmp/test-headers -o /tmp/test-body -w '%{http_code}' "$@")"
  docker_exec "$container_name" cat /tmp/test-headers > "$headers"
  docker_exec "$container_name" cat /tmp/test-body > "$body"
  printf '%s' "$status"
}

assert_status() {
  local expected="$1"
  shift
  local actual
  actual="$(request "$@")"
  [[ "$actual" == "$expected" ]] || fail "status esperado $expected, recebido $actual em $*"
}

assert_single_header() {
  local name="$1"
  local expected="$2"
  local count
  count="$(grep -Eic "^${name}:" "$headers")"
  [[ "$count" -eq 1 ]] || fail "header $name deve aparecer exatamente uma vez"
  grep -Eiq "^${name}:[[:space:]]*${expected}" "$headers" \
    || fail "header $name não possui a política esperada"
}

# Domínio oficial e política única de headers.
assert_status 200 "$base/healthz"
assert_single_header Strict-Transport-Security 'max-age=31536000'
assert_single_header X-Content-Type-Options 'nosniff'
assert_single_header X-Frame-Options 'DENY'
assert_single_header Referrer-Policy 'strict-origin-when-cross-origin'
assert_single_header Permissions-Policy 'camera=\(\), microphone=\(\), geolocation=\(\)'
assert_single_header Content-Security-Policy "default-src 'self'"
if grep -Eiq '^X-Powered-By:' "$headers" || grep -Eiq '^Server:.*[0-9]' "$headers"; then
  fail "resposta pública expõe tecnologia ou versão"
fi

# HTTP só redireciona quando o Host é o domínio oficial.
http_headers="$tmp_dir/http-headers"
http_status="$(docker_exec "$container_name" curl -sS -D /tmp/http-headers -o /dev/null -w '%{http_code}' \
  -H "Host: $domain" "http://127.0.0.1:8080/healthz")"
docker_exec "$container_name" cat /tmp/http-headers > "$http_headers"
[[ "$http_status" == 301 ]] || fail "domínio oficial não redirecionou HTTP para HTTPS"
grep -Eiq "^Location:[[:space:]]*https://${domain}/healthz" "$http_headers" \
  || fail "redirect HTTP usa destino inesperado"

unknown_host_status="$(docker_exec "$container_name" curl -sS --max-time 5 -o /dev/null -w '%{http_code}' \
  -H 'Host: atacante.invalid' 'http://127.0.0.1:8080/' 2>/dev/null || true)"
[[ "$unknown_host_status" == 000 ]] || fail "Host HTTP arbitrário não foi encerrado"

invalid_sni_status="$(docker_exec "$container_name" curl -ksS --max-time 5 -o /dev/null -w '%{http_code}' \
  --resolve 'atacante.invalid:8443:127.0.0.1' \
  'https://atacante.invalid:8443/' 2>/dev/null || true)"
[[ "$invalid_sni_status" == 000 ]] || fail "SNI arbitrário não foi rejeitado no handshake"

forged_host_status="$(docker_exec "$container_name" curl -ksS --max-time 5 "${resolve[@]}" -o /dev/null -w '%{http_code}' \
  -H 'Host: atacante.invalid' "$base/healthz" 2>/dev/null || true)"
[[ "$forged_host_status" != 200 ]] || fail "Host forjado entregou a aplicação"

# Regras locais: path, query e headers customizados. A requisição legítima
# equivalente precisa continuar funcionando.
assert_status 403 "$base/%252e%252e%252fetc/passwd"
assert_status 403 "$base/healthz?arquivo=%252e%252e%252fetc/passwd"
marker="token-sensivel-${RANDOM}-<script>alert(1)</script>"
assert_status 403 -H "X-XSRF-TOKEN: $marker" "$base/healthz"
assert_status 200 -H 'X-XSRF-TOKEN: csrf-legitimo-123' "$base/healthz"

docker logs "$container_name" > "$tmp_dir/container.log" 2>&1
if grep -Fq "$marker" "$tmp_dir/container.log"; then
  fail "WAF registrou o valor sensível do header"
fi

# Um upstream ausente produz 5xx controlado pela borda, sem página padrão.
assert_status 502 "$base/rota-inexistente"
grep -Fq 'Requisição rejeitada pela camada de segurança' "$body" \
  || fail "erro 5xx não usa o corpo genérico"
if grep -Eiq 'Tomcat|Apache|nginx/[0-9]|stack trace|org\.apache\.catalina' "$body"; then
  fail "erro 5xx expõe componente interno"
fi

echo "Controles de Host/SNI, headers, WAF e erros validados com sucesso."
