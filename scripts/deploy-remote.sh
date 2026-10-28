#!/usr/bin/env bash
set -Eeuo pipefail

readonly new_tag="${1:?informe a tag da imagem}"
readonly overlay="${2:?informe o arquivo Compose do ambiente}"
readonly app_dir="/opt/gestao-refeitorio"
readonly state_file=".image-tag-${overlay%.yml}"
readonly cosign_image="ghcr.io/sigstore/cosign/cosign:v3.1.4@sha256:0f06154836d2de34f887a5c273506d52ca43edaa1d9e53e6510fa78a48f69c2d"
readonly certificate_identity="https://github.com/ifpebj-ti/gestao-refeitorio/.github/workflows/pipeline.yml@refs/heads/main"
readonly certificate_issuer="https://token.actions.githubusercontent.com"

cd "$app_dir"

previous_tag=""
if [[ -f "$state_file" ]]; then
  previous_tag="$(<"$state_file")"
fi

compose() {
  docker compose -f docker-compose.yml -f "$overlay" "$@"
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
  trap - ERR

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
compose up -d --remove-orphans

healthy=false
for _ in {1..36}; do
  if curl --fail --silent --show-error http://127.0.0.1:8080/actuator/health >/dev/null \
    && curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null; then
    healthy=true
    break
  fi
  sleep 5
done

if [[ "$healthy" != true ]]; then
  echo "A aplicação não ficou saudável dentro de 180 segundos."
  false
fi

printf '%s\n' "$new_tag" > "$state_file"
docker image prune -f --filter "until=168h"
compose ps
trap - ERR

echo "Deploy concluído com a tag ${new_tag}."
