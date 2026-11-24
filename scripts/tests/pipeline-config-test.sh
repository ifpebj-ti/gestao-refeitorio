#!/usr/bin/env bash
set -Eeuo pipefail

readonly project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly ci="${project_dir}/.github/workflows/ci.yml"
readonly security="${project_dir}/.github/workflows/security.yml"
readonly cd="${project_dir}/.github/workflows/cd.yml"
readonly legacy_pipeline="${project_dir}/.github/workflows/pipeline.yml"
readonly dependabot="${project_dir}/.github/dependabot.yml"
readonly compose_prod="${project_dir}/docker-compose.prod.yml"
readonly compose_dev="${project_dir}/docker-compose.dev.yml"
readonly backend_pom="${project_dir}/backend/pom.xml"
readonly backend_dockerfile="${project_dir}/backend/Dockerfile"
readonly frontend_package="${project_dir}/frontend/package.json"
readonly frontend_dockerfile="${project_dir}/frontend/Dockerfile"
readonly frontend_vitest="${project_dir}/frontend/vitest.config.ts"
readonly frontend_next_config="${project_dir}/frontend/next.config.js"
readonly backend_prod_config="${project_dir}/backend/src/main/resources/application-prod.yml"
readonly production_security_smoke="${project_dir}/scripts/tests/production-security-smoke-test.sh"
readonly badge_generator="${project_dir}/scripts/generate-coverage-badges.mjs"
readonly badge_publisher="${project_dir}/scripts/publish-coverage-badges.sh"
readonly workflow_waiter="${project_dir}/scripts/wait-for-workflow.sh"
readonly deploy_script="${project_dir}/scripts/deploy-remote.sh"
readonly readme="${project_dir}/README.md"
readonly zap_rules="${project_dir}/.zap/rules.tsv"
readonly codeowners="${project_dir}/.github/CODEOWNERS"
readonly contributing="${project_dir}/CONTRIBUTING.md"
readonly trivy_ignore="${project_dir}/.trivyignore.yaml"

fail() { echo "FALHA: $*" >&2; exit 1; }
assert_file_contains() {
  local file="$1"
  local expected="$2"
  grep -Fq -- "$expected" "$file" || fail "${file} não contém: ${expected}"
}

for workflow in "$ci" "$security" "$cd"; do
  [[ -s "$workflow" ]] || fail "workflow ausente: $workflow"
done
[[ ! -e "$legacy_pipeline" ]] || fail "workflow consolidado ainda existe"

assert_file_contains "$ci" "name: CI"
assert_file_contains "$security" "name: Security"
assert_file_contains "$cd" "name: CD / Release"
assert_file_contains "$ci" "name: CI / Required"
assert_file_contains "$security" "name: Security / Required"
assert_file_contains "$security" 'gh workflow run cd.yml --ref main -f source_sha="$GITHUB_SHA"'
assert_file_contains "$security" '--repo "$GITHUB_REPOSITORY"'
assert_file_contains "$cd" 'gh workflow run security.yml --ref main -f run_dast=true'
assert_file_contains "$cd" '--repo "$GITHUB_REPOSITORY"'
assert_file_contains "$cd" 'bash scripts/wait-for-workflow.sh ci.yml'
assert_file_contains "$cd" 'bash scripts/wait-for-workflow.sh security.yml'

for workflow in "$ci" "$security" "$cd"; do
  if grep -E '^[[:space:]]*uses:' "$workflow" |
    grep -Ev 'uses:[[:space:]]+[^[:space:]@]+@[a-f0-9]{40}([[:space:]]+#.*)?$' >/dev/null; then
    fail "action sem pin por SHA em $workflow"
  fi
done

assert_file_contains "$ci" "name: CI / Frontend"
assert_file_contains "$ci" "name: CI / Backend"
assert_file_contains "$ci" "npm run test:coverage"
assert_file_contains "$ci" "mvn -B --no-transfer-progress clean verify"
assert_file_contains "$ci" "name: frontend-coverage-report"
assert_file_contains "$ci" "name: backend-coverage-report"
assert_file_contains "$ci" "node-version: 24"
assert_file_contains "$frontend_package" '"test:coverage": "vitest run --coverage"'
assert_file_contains "$frontend_vitest" '"json-summary"'
assert_file_contains "$frontend_vitest" "lines: 70"
assert_file_contains "$frontend_vitest" "statements: 70"
assert_file_contains "$frontend_vitest" "functions: 70"
assert_file_contains "$backend_pom" "<artifactId>jacoco-maven-plugin</artifactId>"
assert_file_contains "$backend_pom" "<minimum>0.70</minimum>"

assert_file_contains "$ci" "Generate consolidated line and branch badges"
assert_file_contains "$ci" "Publish badges atomically"
assert_file_contains "$ci" "github.ref == 'refs/heads/main'"
assert_file_contains "$badge_generator" "coverage-lines.svg"
assert_file_contains "$badge_generator" "coverage-branches.svg"
assert_file_contains "$badge_publisher" 'branch="coverage-badges"'
assert_file_contains "$readme" "coverage-lines.svg"
assert_file_contains "$readme" "coverage-branches.svg"
assert_file_contains "$readme" "actions/workflows/ci.yml"
assert_file_contains "$readme" "actions/workflows/security.yml"
assert_file_contains "$readme" "actions/workflows/cd.yml"

assert_file_contains "$security" "scripts/tests/deploy-remote-test.sh"
assert_file_contains "$security" "scripts/tests/coverage-badges-test.sh"
assert_file_contains "$security" "scripts/tests/workflow-wait-test.sh"
assert_file_contains "$security" "scripts/tests/nginx-config-test.sh"
assert_file_contains "$security" "scripts/tests/nginx-security-test.sh"
assert_file_contains "$security" "actions/dependency-review-action"
assert_file_contains "$security" "semgrep/semgrep:1.158.0"
assert_file_contains "$security" "Trivy / repository and images"
assert_file_contains "$security" "name: Security / OWASP ZAP baseline"
assert_file_contains "$security" "fail_action: true"
assert_file_contains "$security" "allow_issue_writing: false"
assert_file_contains "$security" "artifact_name: zap-baseline-report"
assert_file_contains "$security" "zaproxy/action-baseline@de8ad967d3548d44ef623df22cf95c3b0baf8b25"
assert_file_contains "$security" "ghcr.io/zaproxy/zaproxy:stable@sha256:9624669db72f54d86c4b46a7064518bd9bf79d8c61a4c31befa9923489f328af"
assert_file_contains "$zap_rules" $'10038\tFAIL'

frontend_build_count="$(grep -Fc "context: ./frontend" "$security")"
backend_build_count="$(grep -Fc "context: ./backend" "$security")"
[[ "$frontend_build_count" -eq 1 && "$backend_build_count" -eq 1 ]] ||
  fail "cada imagem deve ser construída exatamente uma vez no workflow Security"
refresh_count="$(grep -Fc 'SECURITY_REFRESH=${{ github.run_id }}' "$security")"
[[ "$refresh_count" -eq 2 ]] || fail "SECURITY_REFRESH deve existir uma vez por imagem"
if grep -Fq 'no-cache: true' "$security"; then
  fail "builds de segurança não devem invalidar completamente os caches"
fi
assert_file_contains "$security" "Wait for CI approval of this revision"
assert_file_contains "$security" "Sign approved commit images"
assert_file_contains "$workflow_waiter" "actions/workflows"

assert_file_contains "$cd" "needs.release.outputs.created == 'true'"
assert_file_contains "$cd" "needs.publish-release.result == 'success'"
assert_file_contains "$cd" "Verify Security signatures and promote image tags"
assert_file_contains "$cd" "Verify signed release images"
assert_file_contains "$cd" "security.yml@refs/heads/main"
assert_file_contains "$cd" "cd.yml@refs/heads/main"
assert_file_contains "$deploy_script" ".github/workflows/cd.yml@refs/heads/main"
if grep -Fq 'tag=sha-' "$cd"; then fail "deploy ainda possui fallback para imagem sha-*"; fi
assert_file_contains "$cd" "scripts/deploy-remote.sh"
assert_file_contains "$cd" "infra/nginx"
assert_file_contains "$cd" 'bash /opt/gestao-refeitorio/deploy-remote.sh'
assert_file_contains "$cd" "environment:"
assert_file_contains "$cd" "name: production"
assert_file_contains "$cd" "Run production security smoke tests"
assert_file_contains "$cd" "production-security-smoke-report"
assert_file_contains "$production_security_smoke" "Swagger e Actuator não estão públicos"
assert_file_contains "$production_security_smoke" "Host, SNI e acesso direto por IP são negados"
assert_file_contains "$production_security_smoke" "portas internas 3000 e 8080 não estão expostas"
assert_file_contains "$production_security_smoke" "wait_for_edge_headers"
assert_file_contains "$production_security_smoke" "headers da borda não convergiram após o deploy"

if awk '
  /package-ecosystem:/ { ecosystem=$3 }
  /directory:/ && ecosystem == "docker" && $2 == "/" { found=1 }
  END { exit found ? 0 : 1 }
' "$dependabot"; then fail "Dependabot Docker ainda aponta para raiz sem Dockerfile"; fi
assert_file_contains "$dependabot" "directory: /frontend"
assert_file_contains "$dependabot" "directory: /backend"
assert_file_contains "$dependabot" "frontend-test-tooling:"

assert_file_contains "$compose_prod" 'APP_VERSION: ${IMAGE_TAG}'
assert_file_contains "$compose_dev" 'APP_VERSION: ${IMAGE_TAG:-dev}'
assert_file_contains "$backend_prod_config" 'server-header: ""'
assert_file_contains "$backend_prod_config" "include-stacktrace: never"
if grep -Eq 'Strict-Transport-Security|Content-Security-Policy|X-Frame-Options' "$frontend_next_config"; then
  fail "Next.js ainda emite headers cuja fonte de verdade deve ser a borda"
fi
assert_file_contains "$frontend_dockerfile" "ARG SECURITY_REFRESH=local"
assert_file_contains "$backend_dockerfile" "ARG SECURITY_REFRESH=local"
assert_file_contains "$backend_dockerfile" "--mount=type=cache,target=/root/.m2,sharing=locked"
assert_file_contains "$backend_dockerfile" "for delay in 0 30 60 120 240"
assert_file_contains "$backend_dockerfile" "mvn -B -ntp dependency:go-offline"
if grep -Fq 'mvn -B -U' "$backend_dockerfile"; then fail "backend não deve usar Maven -U"; fi

if compgen -G "${project_dir}/.github/workflows/*codeql*.yml" >/dev/null; then
  fail "workflow CodeQL avançado concorreria com o Default Setup"
fi
assert_file_contains "$trivy_ignore" "vulnerabilities: []"
assert_file_contains "$codeowners" "/.github/ @KauanneC"
assert_file_contains "$codeowners" "/backend/ @Ismaylla @KauanneC"
assert_file_contains "$codeowners" "/frontend/ @imsamille @KauanneC"
assert_file_contains "$contributing" "Prefira **Squash and merge**"
assert_file_contains "$contributing" "force-push e exclusão da"

echo "Workflows independentes, badges e salvaguardas de CI/CD validados."
