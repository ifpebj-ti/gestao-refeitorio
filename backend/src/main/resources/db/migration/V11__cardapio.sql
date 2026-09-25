-- US17/#154: cadastro de cardápio com itens (produtos) e projeção de consumo.
CREATE TABLE cardapios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refeicao VARCHAR(100) NOT NULL,
    data DATE NOT NULL,
    pessoas_estimadas INTEGER NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projeção de consumo (quantidade_por_pessoa * pessoas_estimadas) é calculada em tempo de
-- leitura, nunca persistida (CLAUDE.md seção 4).
CREATE TABLE itens_cardapio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cardapio_id UUID NOT NULL REFERENCES cardapios(id),
    produto_id UUID NOT NULL REFERENCES produtos(id),
    quantidade_por_pessoa NUMERIC(12,3) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
