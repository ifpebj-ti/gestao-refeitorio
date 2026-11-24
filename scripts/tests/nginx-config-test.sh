#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
config_dir="$project_dir/infra/nginx"
compose_file="$config_dir/docker-compose.yml"
nginx_config="$config_dir/nginx.waf.conf"
modsec_exclusions="$config_dir/modsec-exclusions.conf"
custom_rules="$config_dir/custom-rules.conf"
error_page="$config_dir/errors/generic.json"

fail() {
  echo "ERRO: $*" >&2
  exit 1
}

docker_host_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -w "$1"
  else
    printf '%s' "$1"
  fi
}

for file in "$compose_file" "$nginx_config" "$modsec_exclusions" "$custom_rules" "$error_page"; do
  test -s "$file" || fail "arquivo obrigatório ausente ou vazio: $file"
done

grep -Fq 'proxy_pass $frontend;' "$nginx_config" \
  || fail "roteamento do frontend não foi encontrado"
grep -Fq 'location /api/' "$nginx_config" \
  || fail "location da API não foi encontrado"
grep -Fq 'proxy_pass $backend;' "$nginx_config" \
  || fail "roteamento do backend não foi encontrado"
grep -Fq 'return 301 https://gestao-refeitorio-ifpe.duckdns.org$request_uri;' "$nginx_config" \
  || fail "redirecionamento HTTP para HTTPS não foi encontrado"
[[ "$(grep -Fc 'default_server;' "$nginx_config")" -eq 4 ]] \
  || fail "vhosts default-deny IPv4/IPv6 não foram encontrados"
grep -Fq 'ssl_reject_handshake on;' "$nginx_config" \
  || fail "SNI desconhecido não é rejeitado no handshake"
grep -Fq 'return 444;' "$nginx_config" \
  || fail "Host HTTP desconhecido não é rejeitado"
grep -Fq 'ssl_certificate_key /etc/letsencrypt/' "$nginx_config" \
  || fail "caminho externo da chave TLS não foi encontrado"
grep -Fq 'limit_req zone=' "$nginx_config" \
  || fail "rate limiting não foi encontrado"
grep -Fq 'proxy_read_timeout' "$nginx_config" \
  || fail "timeouts do proxy não foram encontrados"
grep -Fq 'error_page 400 408 413 414 429 431 500 502 503 504 /__edge_error.json;' "$nginx_config" \
  || fail "página de erro genérica não cobre erros de borda"
grep -Fq 'proxy_hide_header X-Powered-By;' "$nginx_config" \
  || fail "header de tecnologia do upstream não é ocultado"
for header in Content-Security-Policy Strict-Transport-Security X-Content-Type-Options X-Frame-Options Referrer-Policy Permissions-Policy; do
  [[ "$(grep -Fc "add_header $header" "$nginx_config")" -eq 1 ]] \
    || fail "header $header deve possuir uma única fonte na borda"
done
grep -Fq "id:11001" "$custom_rules" || fail "regra de inspeção de path ausente"
grep -Fq "id:11002" "$custom_rules" || fail "regra de inspeção de query ausente"
grep -Fq "id:11003" "$custom_rules" || fail "regra de headers autenticados ausente"
grep -Eq 'id:11003.*pass,nolog,setvar:tx.gestao_header_attack=1' "$custom_rules" \
  || fail "regra de token deve marcar a transação sem registrar o valor sensível"
grep -Fq 'id:11005' "$custom_rules" \
  || fail "bloqueio indireto de headers maliciosos ausente"
grep -Fq 'MODSEC_AUDIT_LOG_PARTS: "AHZ"' "$compose_file" \
  || fail "audit log do WAF pode registrar headers ou corpos sensíveis"
if grep -Eq 'proxy_set_header[[:space:]]+(Upgrade|Connection)[[:space:]]' "$nginx_config"; then
  fail "cabeçalhos de upgrade HTTP não devem ser encaminhados ao frontend"
fi

if grep -REn --include='*.pem' --include='*.key' --include='*.p12' \
  'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY' "$config_dir"; then
  fail "material de chave privada foi encontrado em infra/nginx"
fi

command -v docker >/dev/null 2>&1 || fail "Docker é necessário para executar nginx -t"
docker info >/dev/null 2>&1 || fail "daemon Docker indisponível"
command -v openssl >/dev/null 2>&1 || fail "OpenSSL é necessário para gerar o certificado efêmero"

image="$(sed -n 's/^[[:space:]]*image:[[:space:]]*//p' "$compose_file" | head -n 1)"
test -n "$image" || fail "imagem do proxy não encontrada no Compose"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

cert_dir="$tmp_dir/letsencrypt/live/gestao-refeitorio-ifpe.duckdns.org"
mkdir -p "$cert_dir"

cat > "$tmp_dir/openssl.cnf" <<'EOF'
[req]
distinguished_name = subject
prompt = no

[subject]
CN = gestao-refeitorio-ifpe.duckdns.org
EOF

openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -config "$tmp_dir/openssl.cnf" \
  -keyout "$cert_dir/privkey.pem" \
  -out "$cert_dir/fullchain.pem" >/dev/null 2>&1

# mktemp cria o diretório com modo 0700. O Nginx da imagem de validação roda
# sem os privilégios do usuário do runner e precisa atravessar os diretórios
# do bind mount para ler o certificado efêmero.
chmod 0755 "$tmp_dir" "$tmp_dir/letsencrypt" "$tmp_dir/letsencrypt/live" "$cert_dir"
chmod 0644 "$cert_dir/privkey.pem" "$cert_dir/fullchain.pem"

# Arquivo vazio portável; evita depender de /dev/null como bind mount no host.
: > "$tmp_dir/default.conf.template"

nginx_config_mount="$(docker_host_path "$nginx_config")"
modsec_exclusions_mount="$(docker_host_path "$modsec_exclusions")"
custom_rules_mount="$(docker_host_path "$custom_rules")"
errors_mount="$(docker_host_path "$config_dir/errors")"
letsencrypt_mount="$(docker_host_path "$tmp_dir/letsencrypt")"
default_template_mount="$(docker_host_path "$tmp_dir/default.conf.template")"

MSYS_NO_PATHCONV=1 docker run --rm \
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
  "$image" nginx -t

echo "Configuração versionada do Nginx/ModSecurity validada com sucesso."
