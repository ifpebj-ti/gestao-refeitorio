-- US26/#286: remetente das notas (fornecedor externo, setor do campus, doador), com cadastro
-- explícito. Sem exclusão física: o remetente só é inativado, para preservar as notas antigas.
CREATE TABLE remetentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    -- CPF (11) ou CNPJ (14), só os dígitos.
    documento VARCHAR(14),
    contato VARCHAR(150),
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unicidade sem diferenciar maiúsculas/minúsculas. Não trata acento ("Agroindustria" e
-- "Agroindústria" continuam distintos).
CREATE UNIQUE INDEX uk_remetentes_nome_lower ON remetentes (LOWER(nome));
