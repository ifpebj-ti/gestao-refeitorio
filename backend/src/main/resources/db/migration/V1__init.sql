-- Migração inicial: tabelas base do sistema.
-- Detalhar demais colunas/constraints conforme o modelo de dados for fechado com o cliente.

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(30) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    origem VARCHAR(30) NOT NULL,
    saldo_atual NUMERIC(12,3) NOT NULL DEFAULT 0,
    valor_referencia NUMERIC(12,2),
    controla_validade BOOLEAN NOT NULL DEFAULT FALSE,
    dias_alerta_validade INTEGER,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES produtos(id),
    tipo VARCHAR(10) NOT NULL,
    quantidade NUMERIC(12,3) NOT NULL,
    data DATE NOT NULL,
    data_validade DATE,
    foto_url VARCHAR(500),
    responsavel_id UUID NOT NULL REFERENCES usuarios(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) NOT NULL UNIQUE,
    data DATE NOT NULL,
    origem VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    justificativa_recusa TEXT,
    validado_por_id UUID REFERENCES usuarios(id),
    validado_em TIMESTAMPTZ,
    documento_url VARCHAR(500),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_movimentacoes_produto ON movimentacoes(produto_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes(data);
CREATE INDEX idx_notas_status ON notas(status);
