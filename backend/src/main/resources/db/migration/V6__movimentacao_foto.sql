-- US08/#88: anexar foto na entrada de produtos.
-- fotoUrl nunca foi usado por nenhum endpoint; o design virou "bytes em banco", não mais uma URL.
ALTER TABLE movimentacoes DROP COLUMN foto_url;

-- Tabela separada (não coluna em movimentacoes) pra não carregar o blob em toda
-- consulta de listagem/histórico. Relação 1:1 opcional — nem toda movimentação tem foto.
CREATE TABLE movimentacao_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimentacao_id UUID NOT NULL UNIQUE REFERENCES movimentacoes(id),
    conteudo BYTEA NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
