-- Pré-requisito pra Movimentacao (US07/#84): local onde o produto fica guardado.
-- Sem CRUD via API por enquanto (#83) — só os locais padrão citados no CLAUDE.md.
-- UUIDs fixos para que o frontend possa referenciá-los de forma estável sem precisar de endpoint.
CREATE TABLE locais_armazenamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO locais_armazenamento (id, nome) VALUES
    ('eddeb319-7af8-4d68-bd88-8a739c968c74', 'Despensa'),
    ('e10aa4e1-9b74-4791-8b01-1a8efd93af8c', 'Congelados/Refrigerados');

