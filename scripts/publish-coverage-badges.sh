#!/usr/bin/env bash
set -Eeuo pipefail

readonly badge_dir="${1:?informe o diretório dos badges}"
readonly repository="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY não definido}"
readonly branch="coverage-badges"

for file in coverage-lines.svg coverage-branches.svg coverage.json; do
  [[ -s "${badge_dir}/${file}" ]] || { echo "Badge ausente ou vazio: ${file}" >&2; exit 1; }
done

api="repos/${repository}"
parent_sha=""
if ! parent_sha="$(gh api "${api}/git/ref/heads/${branch}" --jq .object.sha 2>/dev/null)"; then
  # gh preserva o corpo JSON de erros HTTP no stdout. Limpe-o para que um 404
  # represente corretamente a ausência da branch, em vez de virar um SHA.
  parent_sha=""
fi
base_tree=""
if [[ -n "$parent_sha" ]]; then
  base_tree="$(gh api "${api}/git/commits/${parent_sha}" --jq .tree.sha)"
fi

tree='[]'
for file in coverage-lines.svg coverage-branches.svg coverage.json; do
  blob_sha="$(gh api --method POST "${api}/git/blobs" -f encoding=utf-8 -F content="@${badge_dir}/${file}" --jq .sha)"
  tree="$(jq --arg path "$file" --arg sha "$blob_sha" '. + [{path: $path, mode: "100644", type: "blob", sha: $sha}]' <<<"$tree")"
done

if [[ -n "$base_tree" ]]; then
  tree_sha="$(jq -n --arg base "$base_tree" --argjson tree "$tree" '{base_tree: $base, tree: $tree}' |
    gh api --method POST "${api}/git/trees" --input - --jq .sha)"
  current_tree="$(gh api "${api}/git/commits/${parent_sha}" --jq .tree.sha)"
  if [[ "$tree_sha" == "$current_tree" ]]; then
    echo "Badges já estão atualizados."
    exit 0
  fi
  commit_sha="$(jq -n --arg message 'chore(coverage): update badges' --arg tree "$tree_sha" --arg parent "$parent_sha" \
    '{message: $message, tree: $tree, parents: [$parent]}' |
    gh api --method POST "${api}/git/commits" --input - --jq .sha)"
  gh api --method PATCH "${api}/git/refs/heads/${branch}" -f sha="$commit_sha" -F force=false >/dev/null
else
  tree_sha="$(jq -n --argjson tree "$tree" '{tree: $tree}' |
    gh api --method POST "${api}/git/trees" --input - --jq .sha)"
  commit_sha="$(jq -n --arg message 'chore(coverage): publish badges' --arg tree "$tree_sha" \
    '{message: $message, tree: $tree, parents: []}' |
    gh api --method POST "${api}/git/commits" --input - --jq .sha)"
  gh api --method POST "${api}/git/refs" -f ref="refs/heads/${branch}" -f sha="$commit_sha" >/dev/null
fi

echo "Badges publicados em ${branch} (${commit_sha})."
