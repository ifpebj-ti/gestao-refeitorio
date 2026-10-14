-- US15/#148: alerta de estoque baixo.
-- Quantidade mínima é definida manualmente pela NUTRICIONISTA, opcional (nem todo produto
-- tem controle de estoque mínimo) — mesmo padrão de controla_validade/dias_alerta_validade.
ALTER TABLE produtos ADD COLUMN quantidade_minima NUMERIC(12,3);
