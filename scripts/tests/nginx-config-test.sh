#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
config_dir="$project_dir/infra/nginx"
compose_file="$config_dir/docker-compose.yml"
nginx_config="$config_dir/nginx.waf.conf"
modsec_exclusions="$config_dir/modsec-exclusions.conf"

fail() {
  echo "ERRO: $*" >&2
  exit 1
}

for file in "$compose_file" "$nginx_config" "$modsec_exclusions"; do
  test -s "$file" || fail "arquivo obrigatório ausente ou vazio: $file"
done

grep -Fq 'proxy_pass $frontend;' "$nginx_config" \
  || fail "roteamento do frontend não foi encontrado"
grep -Fq 'location /api/' "$nginx_config" \
  || fail "location da API não foi encontrado"
grep -Fq 'proxy_pass $backend;' "$nginx_config" \
  || fail "roteamento do backend não foi encontrado"
grep -Fq 'return 301 https://$host$request_uri;' "$nginx_config" \
  || fail "redirecionamento HTTP para HTTPS não foi encontrado"
grep -Fq 'ssl_certificate_key /etc/letsencrypt/' "$nginx_config" \
  || fail "caminho externo da chave TLS não foi encontrado"
grep -Fq 'limit_req zone=' "$nginx_config" \
  || fail "rate limiting não foi encontrado"
grep -Fq 'proxy_read_timeout' "$nginx_config" \
  || fail "timeouts do proxy não foram encontrados"
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

docker run --rm \
  -e MODSEC_RULE_ENGINE=On \
  -e PARANOIA=1 \
  -e 'ALLOWED_METHODS=GET HEAD POST OPTIONS PUT PATCH DELETE' \
  -e MODSEC_REQ_BODY_LIMIT=6291456 \
  -e MODSEC_AUDIT_LOG_FORMAT=JSON \
  -e MODSEC_AUDIT_LOG_PARTS=ABHZ \
  -e 'RESOLVER_CONFIG=valid=10s ipv6=off' \
  -v "$nginx_config:/etc/nginx/conf.d/gestao.conf:ro" \
  -v "$modsec_exclusions:/etc/modsecurity.d/owasp-crs/rules/REQUEST-900-EXCLUSION-RULES-BEFORE-CRS.conf:ro" \
  -v "$tmp_dir/letsencrypt:/etc/letsencrypt:ro" \
  -v "$tmp_dir/default.conf.template:/etc/nginx/templates/conf.d/default.conf.template:ro" \
  "$image" nginx -t

echo "Configuração versionada do Nginx/ModSecurity validada com sucesso."
