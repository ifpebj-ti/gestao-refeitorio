-- Login é exclusivamente via Google OAuth2/OIDC (ver CLAUDE.md seção 5).
-- Não há autenticação por senha local, então a coluna não é necessária.
ALTER TABLE usuarios DROP COLUMN senha_hash;
