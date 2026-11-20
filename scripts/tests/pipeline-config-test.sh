#!/usr/bin/env bash
set -Eeuo pipefail

readonly project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly pipeline="${project_dir}/.github/workflows/pipeline.yml"
readonly dependabot="${project_dir}/.github/dependabot.yml"
readonly backend_pom="${project_dir}/backend/pom.xml"
readonly frontend_package="${project_dir}/frontend/package.json"
readonly frontend_vitest="${project_dir}/frontend/vitest.config.ts"
readonly zap_rules="${project_dir}/.zap/rules.tsv"
readonly codeowners="${project_dir}/.github/CODEOWNERS"
readonly contributing="${project_dir}/CONTRIBUTING.md"
readonly trivy_ignore="${project_dir}/.trivyignore.yaml"

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
assert_file_contains "$pipeline" "scripts/deploy-remote.sh"
assert_file_contains "$pipeline" 'bash /opt/gestao-refeitorio/deploy-remote.sh'
if grep -Fq '< scripts/deploy-remote.sh' <<<"$deploy_block"; then
  fail "script de deploy ainda é transmitido por stdin e pode ser consumido pelo Docker Compose"
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

security_builds="$(sed -n '/name: Build frontend image for security scan/,/name: Trivy \/ repository and images/p' "$pipeline")"
no_cache_count="$(grep -Fc 'no-cache: true' <<<"$security_builds")"
[[ "$no_cache_count" -eq 2 ]] \
  || fail "os builds de segurança do frontend e backend devem ignorar caches de camadas vulneráveis"

assert_file_contains "$pipeline" "name: Security / OWASP ZAP baseline"
assert_file_contains "$pipeline" "needs.deploy-production.result == 'success'"
assert_file_contains "$pipeline" "fail_action: true"
assert_file_contains "$pipeline" "allow_issue_writing: false"
assert_file_contains "$pipeline" "artifact_name: zap-baseline-report"
assert_file_contains "$pipeline" "zaproxy/action-baseline@6c5a007541891231cd9e0ddec25d4f25c59c9874"
assert_file_contains "$pipeline" "ghcr.io/zaproxy/zaproxy:stable@sha256:9624669db72f54d86c4b46a7064518bd9bf79d8c61a4c31befa9923489f328af"
assert_file_contains "$zap_rules" $'10038\tFAIL'

if compgen -G "${project_dir}/.github/workflows/*codeql*.yml" >/dev/null; then
  fail "workflow CodeQL avançado concorreria com o Default Setup habilitado"
fi

assert_file_contains "$trivy_ignore" "vulnerabilities: []"
assert_file_contains "$codeowners" "/.github/ @KauanneC"
assert_file_contains "$codeowners" "/backend/ @Ismaylla @KauanneC"
assert_file_contains "$codeowners" "/frontend/ @imsamille @KauanneC"
assert_file_contains "$contributing" "Prefira **Squash and merge**"
assert_file_contains "$contributing" 'Push direto, force-push e exclusão da `main` são proibidos'

echo "Configurações de CI/CD, segurança e governança validadas."
