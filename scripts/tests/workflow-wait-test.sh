#!/usr/bin/env bash
set -Eeuo pipefail

readonly project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly test_dir="$(mktemp -d)"
trap 'rm -rf "$test_dir"' EXIT

cat > "$test_dir/gh" <<'MOCK'
#!/usr/bin/env bash
case "${MOCK_STATE:-success}" in
  success) printf 'completed\tsuccess\n' ;;
  failure) printf 'completed\tfailure\n' ;;
  running) printf 'in_progress\t\n' ;;
esac
MOCK
chmod +x "$test_dir/gh"

readonly sha="0123456789abcdef0123456789abcdef01234567"
common_env=(
  "PATH=$test_dir:$PATH"
  "GITHUB_REPOSITORY=ifpebj-ti/gestao-refeitorio"
  "WORKFLOW_WAIT_ATTEMPTS=1"
  "WORKFLOW_WAIT_INTERVAL_SECONDS=0"
)

env "${common_env[@]}" MOCK_STATE=success \
  bash "$project_dir/scripts/wait-for-workflow.sh" ci.yml "$sha" push

if env "${common_env[@]}" MOCK_STATE=failure \
  bash "$project_dir/scripts/wait-for-workflow.sh" ci.yml "$sha" push 2>/dev/null; then
  echo "FALHA: workflow reprovado foi aceito" >&2
  exit 1
fi

if env "${common_env[@]}" MOCK_STATE=running \
  bash "$project_dir/scripts/wait-for-workflow.sh" ci.yml "$sha" push 2>/dev/null; then
  echo "FALHA: workflow ainda em execução foi aceito" >&2
  exit 1
fi

echo "Dependência entre workflows validada."
