#!/usr/bin/env bash
set -Eeuo pipefail

readonly workflow="${1:?informe o arquivo do workflow}"
readonly head_sha="${2:?informe o SHA esperado}"
readonly event="${3:-push}"
readonly attempts="${WORKFLOW_WAIT_ATTEMPTS:-40}"
readonly interval="${WORKFLOW_WAIT_INTERVAL_SECONDS:-15}"

[[ "$head_sha" =~ ^[a-f0-9]{40}$ ]] || { echo "SHA inválido: $head_sha" >&2; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "GitHub CLI não disponível" >&2; exit 1; }

for ((attempt = 1; attempt <= attempts; attempt++)); do
  run="$(gh api --method GET "repos/${GITHUB_REPOSITORY}/actions/workflows/${workflow}/runs" \
    -f head_sha="$head_sha" -f event="$event" -f per_page=20 \
    --jq '[.workflow_runs[] | select(.head_sha == "'"$head_sha"'" and .event == "'"$event"'")] | sort_by(.run_number) | last | [.status, (.conclusion // "")] | @tsv')"

  status="${run%%$'\t'*}"
  conclusion="${run#*$'\t'}"
  if [[ -z "$run" || "$run" == "null" ]]; then
    echo "Aguardando ${workflow} para ${head_sha} (${attempt}/${attempts})."
  elif [[ "$status" == completed ]]; then
    [[ "$conclusion" == success ]] || {
      echo "${workflow} terminou com conclusão ${conclusion}." >&2
      exit 1
    }
    echo "${workflow} aprovou ${head_sha}."
    exit 0
  else
    echo "${workflow} ainda está ${status} (${attempt}/${attempts})."
  fi
  sleep "$interval"
done

echo "Timeout aguardando ${workflow} para ${head_sha}." >&2
exit 1
