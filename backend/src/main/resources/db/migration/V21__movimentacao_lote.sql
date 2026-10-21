-- Número do lote informado no recebimento (#247). Nulo em saídas e em entradas antigas.
ALTER TABLE movimentacoes ADD COLUMN lote VARCHAR(50);
