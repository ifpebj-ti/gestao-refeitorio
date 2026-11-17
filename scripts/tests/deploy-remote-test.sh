#!/usr/bin/env bash
set -Eeuo pipefail

readonly project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly deploy_script="${project_dir}/scripts/deploy-remote.sh"
readonly test_root="$(mktemp -d)"

cleanup() {
  rm -rf "$test_root"
}
trap cleanup EXIT

fail() {
  echo "FALHA: $*" >&2
  exit 1
}

assert_contains() {
  local file="$1"
  local expected="$2"
  grep -Fq "$expected" "$file" || fail "${file} não contém: ${expected}"
}

assert_up_count() {
  local file="$1"
  local expected="$2"
  local actual=0
  if [[ -f "$file" ]]; then
    actual="$(grep -c '^up|' "$file" || true)"
  fi
  [[ "$actual" == "$expected" ]] || fail "esperava ${expected} compose up, recebeu ${actual}"
}

create_mocks() {
  local bin_dir="$1"
  mkdir -p "$bin_dir"

  cat > "${bin_dir}/docker" <<'MOCK'
#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${1:-}" == "network" && "${2:-}" == "inspect" ]]; then
  exit 1
fi

if [[ "${1:-}" == "run" ]]; then
  if [[ "${TEST_SCENARIO}" == "signature-failure" ]]; then
    exit 1
  fi
  exit 0
fi

if [[ "${1:-}" == "image" && "${2:-}" == "prune" ]]; then
  exit 0
fi

if [[ "${1:-}" != "compose" ]]; then
  exit 0
fi

shift
while [[ "${1:-}" == "-f" ]]; do
  shift 2
done

case "${1:-}" in
  pull)
    if [[ "${TEST_SCENARIO}" == "pull-failure" ]]; then
      exit 1
    fi
    ;;
  exec)
    count=0
    [[ -f "${MOCK_SCHEMA_COUNTER}" ]] && count="$(<"${MOCK_SCHEMA_COUNTER}")"
    count=$((count + 1))
    printf '%s\n' "$count" > "${MOCK_SCHEMA_COUNTER}"
    if [[ "${TEST_SCENARIO}" == "health-with-migration" && "$count" -gt 1 ]]; then
      printf '25\n'
    else
      printf '24\n'
    fi
    ;;
  up)
    printf 'up|%s\n' "${IMAGE_TAG:-}" >> "${MOCK_DOCKER_LOG}"
    ;;
  ps)
    ;;
  logs)
    ;;
esac
MOCK

  cat > "${bin_dir}/curl" <<'MOCK'
#!/usr/bin/env bash
exit 1
MOCK
  chmod +x "${bin_dir}/docker" "${bin_dir}/curl"
}

run_scenario() {
  local scenario="$1"
  local scenario_dir="${test_root}/${scenario}"
  local app_dir="${scenario_dir}/app"
  local bin_dir="${scenario_dir}/bin"
  local output="${scenario_dir}/output.log"
  local docker_log="${scenario_dir}/docker.log"
  local schema_counter="${scenario_dir}/schema-counter"

  mkdir -p "$app_dir"
  touch "${app_dir}/docker-compose.yml" "${app_dir}/docker-compose.prod.yml"
  printf '0.12.0\n' > "${app_dir}/.image-tag-docker-compose.prod"
  create_mocks "$bin_dir"

  set +e
  PATH="${bin_dir}:${PATH}" \
    APP_DIR="$app_dir" \
    HEALTH_TIMEOUT_SECONDS=0 \
    TEST_SCENARIO="$scenario" \
    MOCK_DOCKER_LOG="$docker_log" \
    MOCK_SCHEMA_COUNTER="$schema_counter" \
    bash "$deploy_script" sha-candidate docker-compose.prod.yml >"$output" 2>&1
  local exit_code=$?
  set -e

  [[ "$exit_code" -ne 0 ]] || fail "${scenario} deveria terminar com erro"
  [[ "$(<"${app_dir}/.image-tag-docker-compose.prod")" == "0.12.0" ]] \
    || fail "${scenario} alterou o arquivo de estado"

  case "$scenario" in
    signature-failure|pull-failure)
      assert_up_count "$docker_log" 0
      assert_contains "$output" "Deploy falhou antes da troca dos containers; rollback não será executado."
      assert_contains "$output" "Os containers em produção permanecem inalterados."
      ;;
    health-without-migration)
      assert_up_count "$docker_log" 2
      assert_contains "$docker_log" "up|sha-candidate"
      assert_contains "$docker_log" "up|0.12.0"
      assert_contains "$output" "Deploy falhou; restaurando 0.12.0."
      ;;
    health-with-migration)
      assert_up_count "$docker_log" 1
      assert_contains "$docker_log" "up|sha-candidate"
      assert_contains "$output" "O banco foi migrado de V24 para V25"
      assert_contains "$output" "Rollback de imagem cancelado"
      ;;
  esac

  echo "OK: ${scenario}"
}

run_scenario signature-failure
run_scenario pull-failure
run_scenario health-without-migration
run_scenario health-with-migration

echo "Todos os cenários de rollback do deploy passaram."
