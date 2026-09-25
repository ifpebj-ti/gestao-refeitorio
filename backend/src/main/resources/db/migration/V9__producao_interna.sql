-- US13/#142: registrar recebimento da produção interna.
-- Setor produtivo é cadastrável dinamicamente (sem seed, sem CRUD dedicado) — criado sob
-- demanda pelo service na primeira vez que aparece um nome novo, mesmo padrão adotado
-- pra locais_armazenamento (CLAUDE.md seção 13.3).
CREATE TABLE setores_produtivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela separada de movimentacoes (não coluna), mesmo motivo de movimentacao_fotos: nem toda
-- entrada é produção interna, e não queremos carregar esse join em toda consulta de estoque.
CREATE TABLE producoes_internas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimentacao_id UUID NOT NULL UNIQUE REFERENCES movimentacoes(id),
    setor_id UUID NOT NULL REFERENCES setores_produtivos(id),
    responsavel_setor VARCHAR(150) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
