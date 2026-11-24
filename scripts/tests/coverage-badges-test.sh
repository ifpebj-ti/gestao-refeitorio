#!/usr/bin/env bash
set -Eeuo pipefail

readonly project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly test_dir="$(mktemp -d)"
trap 'rm -rf "$test_dir"' EXIT

cat > "$test_dir/coverage-summary.json" <<'JSON'
{
  "total": {
    "lines": {"total": 100, "covered": 80, "skipped": 0, "pct": 80},
    "branches": {"total": 50, "covered": 40, "skipped": 0, "pct": 80}
  }
}
JSON

cat > "$test_dir/jacoco.csv" <<'CSV'
GROUP,PACKAGE,CLASS,INSTRUCTION_MISSED,INSTRUCTION_COVERED,BRANCH_MISSED,BRANCH_COVERED,LINE_MISSED,LINE_COVERED,COMPLEXITY_MISSED,COMPLEXITY_COVERED,METHOD_MISSED,METHOD_COVERED
app,example,First,0,0,20,30,10,90,0,0,0,0
app,example,Second,0,0,5,5,0,10,0,0,0,0
CSV

node "$project_dir/scripts/generate-coverage-badges.mjs" \
  "$test_dir/coverage-summary.json" "$test_dir/jacoco.csv" "$test_dir/output"

grep -Fq "85.7%" "$test_dir/output/coverage-lines.svg"
grep -Fq "68.2%" "$test_dir/output/coverage-branches.svg"
grep -Fq '"covered": 180' "$test_dir/output/coverage.json"

if node "$project_dir/scripts/generate-coverage-badges.mjs" \
  "$test_dir/missing.json" "$test_dir/jacoco.csv" "$test_dir/invalid-output" 2>/dev/null; then
  echo "FALHA: relatório ausente não deveria publicar badges" >&2
  exit 1
fi
[[ ! -e "$test_dir/invalid-output/coverage-lines.svg" ]] ||
  { echo "FALHA: valor incorreto foi publicado" >&2; exit 1; }

echo "Geração segura dos badges de cobertura validada."
