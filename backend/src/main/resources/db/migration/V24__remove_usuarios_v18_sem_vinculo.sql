-- Remove os usuários semeados pela V18 que não têm histórico (#207); os com vínculo ficam.
-- Sem isso, todo banco novo já nasce com ADMIN e o ADMIN inicial (ADMIN_INICIAL_EMAIL) nunca é criado.
DELETE FROM usuarios u
WHERE u.id IN ('7c139eb0-bd2b-4692-840e-29e517058a20',
               'b1ff4806-93f9-4ad1-82b2-b56671dfa721',
               '3f5ebd20-ea67-4d77-83e7-a59b348f311d')
  AND NOT EXISTS (SELECT 1 FROM movimentacoes m WHERE m.responsavel_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM notas n WHERE n.validado_por_id = u.id OR n.registrado_por_id = u.id);
