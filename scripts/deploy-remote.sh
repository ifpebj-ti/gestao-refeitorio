#!/usr/bin/env bash
set -Eeuo pipefail

readonly new_tag="${1:?informe a tag da imagem}"
readonly overlay="${2:?informe o arquivo Compose do ambiente}"
readonly app_dir="/opt/gestao-refeitorio"
readonly state_file=".image-tag-${overlay%.yml}"
readonly cosign_image="ghcr.io/sigstore/cosign/cosign:v3.1.4@sha256:0f06154836d2de34f887a5c273506d52ca43edaa1d9e53e6510fa78a48f69c2d"
readonly certificate_identity="https://github.com/ifpebj-ti/gestao-refeitorio/.github/workflows/pipeline.yml@refs/heads/main"
readonly certificate_issuer="https://token.actions.githubusercontent.com"
readonly observability_overlay="docker-compose.observabilidade.yml"
readonly observability_network="lgtm_default"
# A VM leva mais de 180 s para subir uma versão com migrations novas (#322); configurável por variável.
readonly health_timeout="${HEALTH_TIMEOUT_SECONDS:-600}"
readonly health_interval=5

cd "$app_dir"

previous_tag=""
if [[ -f "$state_file" ]]; then
  previous_tag="$(<"$state_file")"
fi
schema_before=""

compose_files=(-f docker-compose.yml -f "$overlay")
# Overlay da observabilidade só com a rede do LGTM presente: sem ela, o compose falharia e o deploy faria rollback.
if [[ -f "$observability_overlay" ]] && docker network inspect "$observability_network" >/dev/null 2>&1; then
  compose_files+=(-f "$observability_overlay")
  echo "Rede ${observability_network} encontrada; backend conectado à observabilidade."
fi

compose() {
  docker compose "${compose_files[@]}" "$@"
}

# Última migration do Flyway aplicada com sucesso; vazio quando não dá pra ler (banco fora do ar,
# banco novo). O "|| true" evita disparar o trap de ERR dentro da substituição de comando.
flyway_version() {
  compose exec -T db sh -c \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT COALESCE(max(version::int), 0) FROM flyway_schema_history WHERE success"' \
    2>/dev/null || true
}

# O log do Actions é público: só linhas de erro/subida do backend, com e-mails mascarados.
print_failure_diagnostics() {
  local backend_id
  echo "Diagnóstico do deploy com falha:"
  compose ps || true
  backend_id="$(compose ps -q backend 2>/dev/null || true)"
  if [[ -n "$backend_id" ]]; then
    docker inspect --format 'backend: {{.State.Status}}, reinícios={{.RestartCount}}, OOMKilled={{.State.OOMKilled}}' \
      "$backend_id" || true
  fi
  compose logs --no-color --tail 300 backend 2>/dev/null \
    | grep -E 'ERROR|WARN|Exception|Caused by|APPLICATION FAILED|Started|Migrating schema|OutOfMemory' \
    | sed -E 's/[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]+/<email>/g' \
    | tail -n 60 || true
}

verify_image_signature() {
  local image_ref="$1"
  local -a docker_args=(
    --rm
    --user "$(id -u):$(id -g)"
    --env HOME=/tmp/cosign-home
  )

  if [[ -f "${HOME}/.docker/config.json" ]]; then
    docker_args+=(
      --env DOCKER_CONFIG=/docker-config
      --volume "${HOME}/.docker:/docker-config:ro"
    )
  fi

  echo "Verificando assinatura keyless de ${image_ref}."
  docker run "${docker_args[@]}" "$cosign_image" verify \
    --certificate-identity "$certificate_identity" \
    --certificate-oidc-issuer "$certificate_issuer" \
    "$image_ref" >/dev/null
}

rollback() {
  local exit_code=$?
  local schema_after
  trap - ERR

  print_failure_diagnostics

  # Flyway não desfaz migrations: se a versão nova já migrou o banco, a imagem anterior pode não subir
  # mais (foi o que derrubou a produção na v0.12.0, com a V23 removendo notas.origem).
  schema_after="$(flyway_version)"
  if [[ "$schema_before" =~ ^[0-9]+$ && "$schema_after" =~ ^[0-9]+$ ]] && (( schema_after > schema_before )); then
    echo "O banco foi migrado de V${schema_before} para V${schema_after}; voltar para ${previous_tag:-a versão anterior} quebraria o schema."
    echo "Rollback de imagem cancelado: ${new_tag} continua rodando. Verifique o diagnóstico acima."
    exit "$exit_code"
  fi
  if [[ -z "$schema_after" ]]; then
    echo "Aviso: não foi possível ler a versão do Flyway; seguindo com o rollback de imagem."
  fi

  if [[ -n "$previous_tag" ]]; then
    echo "Deploy falhou; restaurando ${previous_tag}."
    export IMAGE_TAG="$previous_tag"
    compose up -d --remove-orphans
  else
    echo "Deploy falhou e ainda não existe uma versão anterior registrada."
  fi

  exit "$exit_code"
}
trap rollback ERR

export IMAGE_TAG="$new_tag"
verify_image_signature "ghcr.io/ifpebj-ti/gestao-refeitorio-frontend:${IMAGE_TAG}"
verify_image_signature "ghcr.io/ifpebj-ti/gestao-refeitorio-backend:${IMAGE_TAG}"
compose pull backend frontend
schema_before="$(flyway_version)"
echo "Versão do Flyway antes do deploy: ${schema_before:-desconhecida}."
compose up -d --remove-orphans

healthy=false
elapsed=0
while (( elapsed < health_timeout )); do
  if curl --fail --silent http://127.0.0.1:8080/actuator/health >/dev/null \
    && curl --fail --silent http://127.0.0.1:3000/ >/dev/null; then
    healthy=true
    break
  fi
  sleep "$health_interval"
  elapsed=$(( elapsed + health_interval ))
  if (( elapsed % 30 == 0 )); then
    echo "Aguardando a aplicação ficar saudável (${elapsed}/${health_timeout} s)."
  fi
done

if [[ "$healthy" != true ]]; then
  echo "A aplicação não ficou saudável dentro de ${health_timeout} segundos."
  false
fi
echo "Aplicação saudável após ${elapsed} segundos."

printf '%s\n' "$new_tag" > "$state_file"
docker image prune -f --filter "until=168h"
compose ps
trap - ERR

echo "Deploy concluído com a tag ${new_tag}."
