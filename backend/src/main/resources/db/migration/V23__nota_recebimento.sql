-- US27/#287: nota de recebimento ligada a um remetente (V22) e a uma ou mais entradas.
-- A tabela notas está vazia (nenhum endpoint escrevia nela), por isso as colunas NOT NULL
-- entram sem valor padrão.
ALTER TABLE notas DROP COLUMN origem;

-- O número só é único por remetente: remetentes diferentes podem repetir a numeração.
ALTER TABLE notas DROP CONSTRAINT notas_numero_key;

ALTER TABLE notas ADD COLUMN remetente_id UUID NOT NULL REFERENCES remetentes(id);
ALTER TABLE notas ADD COLUMN registrado_por_id UUID NOT NULL REFERENCES usuarios(id);
ALTER TABLE notas ADD COLUMN observacoes VARCHAR(500);
ALTER TABLE notas ADD CONSTRAINT uk_notas_remetente_numero UNIQUE (remetente_id, numero);

-- Tabela lateral, como movimentacao_fotos e producoes_internas: movimentacoes não muda.
-- movimentacao_id como PK garante que uma entrada pertença a no máximo uma nota.
CREATE TABLE nota_movimentacoes (
    nota_id UUID NOT NULL REFERENCES notas(id),
    movimentacao_id UUID PRIMARY KEY REFERENCES movimentacoes(id)
);

CREATE INDEX idx_nota_movimentacoes_nota ON nota_movimentacoes(nota_id);
