-- US28/#290: anexar o documento digitalizado da nota (PDF, JPEG ou PNG).
-- documento_url nunca foi usado por nenhum endpoint; o arquivo passa a ficar em bytes no banco,
-- a mesma decisão das fotos de movimentação (V6).
ALTER TABLE notas DROP COLUMN documento_url;

-- Tabela separada (não coluna em notas) pra não carregar o blob nas consultas de nota.
-- Relação 1:1 opcional: anexar o documento não é obrigatório.
CREATE TABLE nota_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nota_id UUID NOT NULL UNIQUE REFERENCES notas(id),
    conteudo BYTEA NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
