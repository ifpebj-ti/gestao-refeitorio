-- Pré-requisito pra Movimentacao (US07/#84): local onde o produto fica guardado.
-- Sem CRUD via API por enquanto (#83) — só os locais padrão citados no CLAUDE.md.
CREATE TABLE locais_armazenamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO locais_armazenamento (nome) VALUES
    ('Despensa'),
    ('Congelados/Refrigerados');
