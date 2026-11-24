#!/usr/bin/env bash
set -Eeuo pipefail

readonly base_url="${1:-${PRODUCTION_URL:-}}"
readonly report_file="${2:-production-security-smoke-report.txt}"

mkdir -p "$(dirname "$report_file")"
exec > >(tee "$report_file") 2>&1

fail() {
  echo "[FALHA] $*" >&2
  exit 1
}

pass() {
  echo "[OK] $*"
}

[[ "$base_url" =~ ^https://[^/]+/?$ ]] \
  || fail "PRODUCTION_URL deve ser uma origem HTTPS sem path"
command -v curl >/dev/null 2>&1 || fail "curl não está disponível"
command -v getent >/dev/null 2>&1 || fail "getent não está disponível"

readonly base="${base_url%/}"
readonly authority="${base#https://}"
readonly host="${authority%%:*}"
readonly https_port="${authority##*:}"
if [[ "$https_port" == "$authority" ]]; then
  readonly effective_https_port=443
else
  [[ "$https_port" =~ ^[0-9]+$ ]] || fail "porta HTTPS inválida em PRODUCTION_URL"
  readonly effective_https_port="$https_port"
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
headers="$tmp_dir/headers"
body="$tmp_dir/body"

request() {
  curl --noproxy '*' -sS --max-time 20 -D "$headers" -o "$body" -w '%{http_code}' "$@"
}

assert_status() {
  local expected="$1"
  shift
  local actual
  actual="$(request "$@")"
  [[ "$actual" =~ $expected ]] || fail "status $actual fora do esperado ($expected) em $*"
}

assert_single_header() {
  local name="$1"
  local expected="$2"
  local count
  count="$(grep -Eic "^${name}:" "$headers")"
  [[ "$count" -eq 1 ]] || fail "$name apareceu $count vezes"
  grep -Eiq "^${name}:[[:space:]]*${expected}" "$headers" \
    || fail "$name não possui a política esperada"
}

assert_no_fingerprint() {
  if grep -Eiq '^X-Powered-By:|^Server:.*[0-9]' "$headers"; then
    fail "headers expõem tecnologia ou versão"
  fi
  if grep -Eiq 'Apache Tomcat|Whitelabel Error Page|nginx/[0-9]|stack trace|org\.apache\.catalina|java\.[a-z]+\.' "$body"; then
    fail "corpo da resposta expõe detalhes internos"
  fi
}

edge_headers_ready() {
  local status
  status="$(request "$base/")" || return 1
  [[ "$status" =~ ^(200|204|30[1278])$ ]] || return 1

  local name
  for name in \
    Strict-Transport-Security \
    X-Content-Type-Options \
    X-Frame-Options \
    Referrer-Policy \
    Permissions-Policy \
    Content-Security-Policy; do
    [[ "$(grep -Eic "^${name}:" "$headers" || true)" -eq 1 ]] || return 1
  done
}

wait_for_edge_headers() {
  local attempt
  for attempt in {1..12}; do
    if edge_headers_ready; then
      return 0
    fi
    echo "Aguardando convergência dos headers da borda (${attempt}/12)."
    sleep 5
  done
  fail "headers da borda não convergiram após o deploy"
}

assert_edge_headers() {
  assert_single_header Strict-Transport-Security 'max-age=31536000'
  assert_single_header X-Content-Type-Options 'nosniff'
  assert_single_header X-Frame-Options 'DENY'
  assert_single_header Referrer-Policy 'strict-origin-when-cross-origin'
  assert_single_header Permissions-Policy 'camera=\(\), microphone=\(\), geolocation=\(\)'
  assert_single_header Content-Security-Policy "default-src 'self'"
  assert_no_fingerprint
}

echo "Smoke test de segurança: $base"

# Durante a troca do container do proxy, uma conexão pode alcançar por poucos
# segundos a configuração anterior. Aguarda a borda convergir, mas mantém as
# asserções estritas abaixo para que duplicações persistentes continuem falhando.
wait_for_edge_headers

assert_status '^(200|204|30[1278])$' "$base/"
assert_edge_headers
pass "HTTPS e headers do frontend"

assert_status '^(401|403|404)$' "$base/api/usuarios"
assert_edge_headers
pass "API não autenticada usa resposta segura"

for path in /api/swagger-ui/index.html /api/v3/api-docs /api/actuator/info; do
  status="$(request "$base$path")"
  [[ ! "$status" =~ ^2 ]] || fail "$path está exposto publicamente"
  assert_no_fingerprint
done
pass "Swagger e Actuator não estão públicos"

assert_status '^204$' -X POST "$base/api/auth/logout"
cookie="$(grep -i '^Set-Cookie:[[:space:]]*token=' "$headers" || true)"
[[ -n "$cookie" ]] || fail "logout não devolveu cookie de sessão"
for attribute in Secure HttpOnly 'SameSite=Lax'; do
  grep -Fqi "$attribute" <<<"$cookie" || fail "cookie sem atributo $attribute"
done
pass "cookie de sessão possui Secure, HttpOnly e SameSite=Lax"

http_base="http://$authority"
assert_status '^(301|308)$' "$http_base/healthz"
grep -Eiq "^Location:[[:space:]]*https://${host}/healthz" "$headers" \
  || fail "HTTP não redireciona para o domínio HTTPS oficial"
pass "redirecionamento HTTP para HTTPS"

ip="$(getent ahostsv4 "$host" | awk 'NR == 1 { print $1 }')"
[[ -n "$ip" ]] || fail "não foi possível resolver $host"

forged_host_status="$(curl --noproxy '*' -ksS --max-time 10 -o /dev/null -w '%{http_code}' \
  -H 'Host: atacante.invalid' "$base/healthz" 2>/dev/null || true)"
[[ ! "$forged_host_status" =~ ^2 ]] || fail "Host arbitrário entregou a aplicação"

invalid_sni_status="$(curl --noproxy '*' -ksS --max-time 10 -o /dev/null -w '%{http_code}' \
  --resolve "atacante.invalid:${effective_https_port}:$ip" \
  "https://atacante.invalid:${effective_https_port}/" 2>/dev/null || true)"
[[ "$invalid_sni_status" == 000 ]] || fail "SNI arbitrário não foi rejeitado"

direct_ip_status="$(curl --noproxy '*' -ksS --max-time 10 -o /dev/null -w '%{http_code}' \
  "https://${ip}:${effective_https_port}/" 2>/dev/null || true)"
[[ ! "$direct_ip_status" =~ ^2 ]] || fail "IP direto entregou a aplicação"
pass "Host, SNI e acesso direto por IP são negados"

for port in 3000 8080; do
  if curl --noproxy '*' -sS --connect-timeout 3 --max-time 5 -o /dev/null "http://${host}:${port}/" 2>/dev/null; then
    fail "porta interna $port está acessível externamente"
  fi
done
pass "portas internas 3000 e 8080 não estão expostas"

assert_status '^403$' --path-as-is "$base/healthz?arquivo=%252e%252e%252fetc/passwd"
assert_status '^403$' -H 'X-XSRF-TOKEN: <script>alert(1)</script>' "$base/healthz"
assert_status '^200$' -H 'X-XSRF-TOKEN: csrf-smoke-legitimo' "$base/healthz"
pass "WAF bloqueia query/header maliciosos sem afetar requisição legítima"

echo "Smoke tests de segurança de produção concluídos com sucesso."
