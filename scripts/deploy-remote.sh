#!/usr/bin/env bash
set -Eeuo pipefail

readonly new_tag="${1:?informe a tag da imagem}"
readonly overlay="${2:?informe o arquivo Compose do ambiente}"
readonly app_dir="/opt/gestao-refeitorio"
readonly state_file=".image-tag-${overlay%.yml}"

cd "$app_dir"

previous_tag=""
if [[ -f "$state_file" ]]; then
  previous_tag="$(<"$state_file")"
fi

compose() {
  docker compose -f docker-compose.yml -f "$overlay" "$@"
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
