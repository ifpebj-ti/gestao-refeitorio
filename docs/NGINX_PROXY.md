# Nginx, proxy reverso e WAF em produção

Este documento descreve a configuração versionada do proxy público do Gestão Refeitório. Os arquivos
em [`infra/nginx`](../infra/nginx) correspondem aos arquivos próprios montados no container em
produção. A configuração base do Nginx e do OWASP CRS pertence à imagem imutável, fixada por digest
no Compose.

## Arquitetura e roteamento

O container `proxy` publica as portas `80` e `443` da VM e participa da rede Docker externa
`gestao-refeitorio_default`, a mesma rede dos containers da aplicação.

| Entrada pública | Destino interno | Controle principal |
|---|---|---|
| `http://gestao-refeitorio-ifpe.duckdns.org/*` | redirecionamento para HTTPS | HTTP 301 |
| `https://gestao-refeitorio-ifpe.duckdns.org/` | `frontend:3000` | 20 req/s, burst 40 |
| `https://gestao-refeitorio-ifpe.duckdns.org/api/` | `backend:8080` | 10 req/s, burst 20 |
| `https://gestao-refeitorio-ifpe.duckdns.org/api/auth/local` | `backend:8080` | 5 req/min, burst 4 |
| `https://gestao-refeitorio-ifpe.duckdns.org/healthz` | resposta do próprio Nginx | sem access log |

O limite do corpo da requisição é `6 MiB`. Os timeouts de cliente, conexão, envio e leitura estão
declarados em `nginx.waf.conf`. O proxy também repassa `Host`, IP de origem e protocolo original,
além de suportar upgrade de conexão usado pelo frontend.

## TLS, certificados e segredos

O HTTPS aceita TLS 1.2 e 1.3. Os certificados são emitidos e renovados pelo Let's Encrypt diretamente
na VM e são montados no container, somente para leitura, a partir de `/etc/letsencrypt`. O diretório
`/var/www/certbot` atende ao desafio ACME.

Certificados, chaves privadas e arquivos `.env` **não pertencem ao repositório**. O `.gitignore`
protege caminhos TLS dentro de `infra/nginx`; os caminhos em `nginx.waf.conf` são apenas referências
aos arquivos existentes na VM.

## WAF e headers

A imagem oficial `ghcr.io/coreruleset/modsecurity-crs:nginx-alpine` executa o ModSecurity com OWASP CRS, `PARANOIA=1` e
limite de corpo coerente com o Nginx. `modsec-exclusions.conf` remove somente campos específicos de
credenciais da inspeção do CRS; ele não desativa o WAF para rotas completas.

O digest da imagem é acompanhado semanalmente pelo Dependabot no diretório `/infra/nginx`; qualquer
atualização deve passar pelo mesmo `nginx -t`, revisão e procedimento de implantação deste guia.

O Nginx é a fonte única dos headers de segurança de borda, incluindo HSTS, CSP, proteção contra
MIME sniffing e framing, Referrer Policy e Permissions Policy.

## Validação automatizada

O job `Security / SAST and dependencies` executa:

```bash
bash scripts/tests/nginx-config-test.sh
```

O teste verifica os controles obrigatórios, procura material de chave privada e executa `nginx -t`
na mesma imagem fixada no Compose. Um certificado efêmero é criado apenas no diretório temporário do
runner e removido ao final.

## Comparação com a configuração ativa

Antes de aplicar uma mudança, compare cada arquivo próprio com a VM:

```bash
cd /opt/gestao-refeitorio
sudo diff -u /opt/gestao-refeitorio-proxy/nginx.waf.conf nginx/nginx.waf.conf || true
sudo diff -u /opt/gestao-refeitorio-proxy/modsec-exclusoes.conf nginx/modsec-exclusions.conf || true
sudo diff -u /opt/gestao-refeitorio-proxy/docker-compose.yml nginx/docker-compose.yml || true
```

Diferenças esperadas na primeira aplicação desta versão são a fixação da imagem por digest, o nome
em inglês do arquivo de exclusões e a explicitação dos parâmetros TLS e de timeout.

## Aplicação na VM

Execute somente depois de a pipeline e a revisão do PR concluírem com sucesso:

```bash
# O deploy de uma release disponibiliza estes arquivos sem alterar o proxy ativo.
source_dir=/opt/gestao-refeitorio/nginx
target_dir=/opt/gestao-refeitorio-proxy

# Valida o candidato usando os certificados e a rede já existentes na VM.
cd "$source_dir"
sudo docker compose config --quiet
sudo docker compose run --rm --no-deps proxy nginx -t

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="/opt/gestao-refeitorio-proxy/backups/$stamp"
sudo install -d -m 750 "$backup_dir"

for file in docker-compose.yml nginx.waf.conf modsec-exclusoes.conf; do
  if sudo test -f "/opt/gestao-refeitorio-proxy/$file"; then
    sudo cp -a "/opt/gestao-refeitorio-proxy/$file" "$backup_dir/"
  fi
done

sudo install -m 640 "$source_dir/docker-compose.yml" "$target_dir/docker-compose.yml"
sudo install -m 640 "$source_dir/nginx.waf.conf" "$target_dir/nginx.waf.conf"
sudo install -m 640 "$source_dir/modsec-exclusions.conf" "$target_dir/modsec-exclusions.conf"

cd "$target_dir"
sudo docker compose config --quiet
sudo docker compose run --rm --no-deps proxy nginx -t
sudo docker compose up -d --force-recreate proxy
sudo docker compose exec proxy nginx -t

curl -fsS http://127.0.0.1/healthz
curl -fsSI http://gestao-refeitorio-ifpe.duckdns.org/
curl -fsSI https://gestao-refeitorio-ifpe.duckdns.org/
curl -fsSI https://gestao-refeitorio-ifpe.duckdns.org/api/actuator/health
```

O primeiro `curl` deve responder `ok`, HTTP deve redirecionar para HTTPS e as duas rotas HTTPS devem
responder pelo proxy. Confirme também externamente que apenas as portas 80 e 443 estão públicas.

## Rollback

Se a validação posterior falhar, restaure o diretório de backup criado na aplicação:

```bash
backup_dir=/opt/gestao-refeitorio-proxy/backups/<timestamp>

sudo install -m 640 "$backup_dir/docker-compose.yml" /opt/gestao-refeitorio-proxy/docker-compose.yml
sudo install -m 640 "$backup_dir/nginx.waf.conf" /opt/gestao-refeitorio-proxy/nginx.waf.conf
sudo install -m 640 "$backup_dir/modsec-exclusoes.conf" /opt/gestao-refeitorio-proxy/modsec-exclusoes.conf

cd /opt/gestao-refeitorio-proxy
sudo docker compose config --quiet
sudo docker compose run --rm --no-deps proxy nginx -t
sudo docker compose up -d --force-recreate proxy
sudo docker compose exec proxy nginx -t
curl -fsS http://127.0.0.1/healthz
```

O rollback do proxy é independente do rollback das imagens da aplicação. Nunca remova ou substitua
`/etc/letsencrypt` durante esse procedimento.
