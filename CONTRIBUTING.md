# Guia de contribuição

## Branches

A `main` é a única branch permanente e recebe mudanças apenas por Pull Request. Use nomes curtos,
em minúsculas e com hífens:

| Prefixo | Uso | Exemplo |
|---|---|---|
| `feature/` | funcionalidade | `feature/consulta-cardapio` |
| `fix/` | correção funcional ou técnica | `fix/validacao-nota` |
| `chore/` | dependências e manutenção | `chore/atualizar-dependencias` |
| `ci/` | pipeline e automação | `ci/adicionar-zap` |
| `docs/` | documentação | `docs/guia-deploy` |
| `test/` | testes | `test/cobertura-usuarios` |
| `hotfix/` | correção urgente de produção | `hotfix/falha-login` |

Branches devem nascer da `main` atualizada e ser removidas depois do merge.

## Commits e Pull Requests

Use Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:` e `test:`). Não inclua
credenciais, arquivos `.env`, artefatos de build ou dados reais nos commits.

Antes de abrir o PR:

1. atualize a branch com a `main`;
2. execute os testes, lint e build afetados;
3. preencha o template e relacione as issues com `Closes #número`;
4. aguarde todos os checks obrigatórios;
5. solicite revisão dos owners indicados em `.github/CODEOWNERS`;
6. resolva todas as conversas antes do merge.

Push direto, force-push e exclusão da `main` são proibidos pelo ruleset. Uma pessoa diferente do
autor deve aprovar o PR. Novos pushes invalidam a aprovação anterior.

## Estratégia de merge

Prefira **Squash and merge**, usando no título final um Conventional Commit válido. Isso preserva
um histórico objetivo e permite que o Release Please calcule corretamente a versão SemVer e o
CHANGELOG. Use merge commit apenas quando a preservação dos commits individuais tiver valor técnico
claro; não use rebase merge para contornar revisão ou checks.

## Alterações de CI/CD e segurança

Mudanças em `.github/`, `.zap/`, `scripts/`, Compose e políticas de segurança exigem revisão do
owner de DevSecOps. Não reduza thresholds, remova scans ou adicione exceções permanentes para tornar
a pipeline verde. Exceções temporárias precisam de justificativa, responsável e data de expiração.
