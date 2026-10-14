-- Data do primeiro login via Google (#208). Nula = usuário ainda não acessou o sistema;
-- usuários já existentes ficam nulos até o próximo login.
ALTER TABLE usuarios ADD COLUMN primeiro_acesso_em TIMESTAMPTZ;
