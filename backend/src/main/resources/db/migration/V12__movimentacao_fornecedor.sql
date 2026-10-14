-- Adiciona coluna fornecedor na tabela movimentacoes para auditoria completa
ALTER TABLE movimentacoes ADD COLUMN fornecedor VARCHAR(150);
