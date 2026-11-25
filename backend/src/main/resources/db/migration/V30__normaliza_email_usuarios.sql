-- E-mail único sem diferenciar maiúsculas e espaços nas pontas (#468): a aplicação passa a gravar e buscar
-- sempre em minúsculas, e o índice abaixo impede duplicidade mesmo em inserções feitas direto no banco.

-- 1. Duplicados já existentes: em cada grupo, fica com o e-mail a conta ativa, que já acessou e mais antiga.
-- As demais são desativadas e recebem um e-mail marcado, sem apagar nada: movimentações e notas continuam
-- ligadas a quem as registrou, e a migration não falha no deploy.
WITH ranqueados AS (
    SELECT id,
           lower(trim(email)) AS normalizado,
           row_number() OVER (
               PARTITION BY lower(trim(email))
               ORDER BY ativo DESC, (primeiro_acesso_em IS NOT NULL) DESC, criado_em, id
           ) AS ordem
    FROM usuarios
)
UPDATE usuarios u
SET email = left(r.normalizado, 230) || '#duplicado-' || left(u.id::text, 8),
    ativo = false
FROM ranqueados r
WHERE u.id = r.id
  AND r.ordem > 1;

-- 2. Sem duplicados, todos os e-mails podem ir para a forma normalizada sem violar o UNIQUE da V1.
UPDATE usuarios
SET email = lower(trim(email))
WHERE email <> lower(trim(email));

-- 3. O UNIQUE da V1 continua valendo; este cobre maiúsculas e minúsculas.
CREATE UNIQUE INDEX uk_usuarios_email_lower ON usuarios (lower(email));
