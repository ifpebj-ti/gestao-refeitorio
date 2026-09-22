-- US07/#84: registrar entrada de produto.
-- "origem" migra de vez de produtos pra movimentacoes (pertence conceitualmente à entrada, não ao cadastro do produto).
ALTER TABLE produtos DROP COLUMN origem;

-- Tabela "movimentacoes" nunca teve registros (nenhum endpoint existia até agora),
-- então as colunas já entram obrigatórias.
ALTER TABLE movimentacoes
    ADD COLUMN local_id UUID NOT NULL REFERENCES locais_armazenamento(id),
    ADD COLUMN origem VARCHAR(30) NOT NULL,
    ADD COLUMN valor NUMERIC(12,2) NOT NULL;
