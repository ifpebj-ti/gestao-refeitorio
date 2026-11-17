#!/usr/bin/env bash
set -Eeuo pipefail

readonly project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly pipeline="${project_dir}/.github/workflows/pipeline.yml"
readonly dependabot="${project_dir}/.github/dependabot.yml"
readonly backend_pom="${project_dir}/backend/pom.xml"
readonly frontend_package="${project_dir}/frontend/package.json"
readonly frontend_vitest="${project_dir}/frontend/vitest.config.ts"

fail() {
  echo "FALHA: $*" >&2
  exit 1
}

assert_file_contains() {
  local file="$1"
  local expected="$2"
  grep -Fq "$expected" "$file" || fail "${file} não contém: ${expected}"
}

deploy_block="$(sed -n '/^  deploy-production:/,$p' "$pipeline")"
grep -Fq "needs.release.outputs.created == 'true'" <<<"$deploy_block" \
  || fail "deploy de produção não está restrito a releases criadas"
grep -Fq "needs.publish-release.result == 'success'" <<<"$deploy_block" \
  || fail "deploy de produção não exige publicação bem-sucedida da release"
if grep -Fq 'tag=sha-' <<<"$deploy_block"; then
  fail "deploy de produção ainda possui fallback para imagem sha-*"
fi

if awk '
  /package-ecosystem:/ { ecosystem=$3 }
  /directory:/ && ecosystem == "docker" && $2 == "/" { found=1 }
  END { exit found ? 0 : 1 }
' "$dependabot"; then
  fail "Dependabot Docker ainda aponta para a raiz sem Dockerfile"
fi
assert_file_contains "$dependabot" "directory: /frontend"
assert_file_contains "$dependabot" "directory: /backend"

assert_file_contains "$backend_pom" "<artifactId>jacoco-maven-plugin</artifactId>"
assert_file_contains "$backend_pom" "<minimum>0.70</minimum>"
assert_file_contains "$pipeline" "name: backend-coverage-report"

assert_file_contains "$frontend_package" '"test:coverage": "vitest run --coverage"'
assert_file_contains "$frontend_package" '"vitest": "^5.1.0"'
assert_file_contains "$frontend_package" '"@vitest/coverage-v8": "^5.1.0"'
assert_file_contains "$frontend_package" '"jsdom": "^31.0.0"'
assert_file_contains "$frontend_vitest" "lines: 70"
assert_file_contains "$frontend_vitest" "statements: 70"
assert_file_contains "$frontend_vitest" "functions: 70"
assert_file_contains "$pipeline" "name: frontend-coverage-report"
assert_file_contains "$pipeline" "node-version: 24"
assert_file_contains "$dependabot" "frontend-test-tooling:"

echo "Configurações de deploy, Dependabot e cobertura validadas."
