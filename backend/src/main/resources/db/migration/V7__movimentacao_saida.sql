-- US09/#91: registrar saída de produto.
-- origem e valor só fazem sentido em ENTRADA (não há "de onde veio" nem "valor de compra"
-- num consumo/perda/descarte); tipo_saida só faz sentido em SAIDA.
ALTER TABLE movimentacoes
    ALTER COLUMN origem DROP NOT NULL,
    ALTER COLUMN valor DROP NOT NULL,
    ADD COLUMN tipo_saida VARCHAR(20);

ALTER TABLE movimentacoes ADD CONSTRAINT chk_movimentacao_tipo_campos CHECK (
    (tipo = 'ENTRADA' AND origem IS NOT NULL AND tipo_saida IS NULL)
    OR
    (tipo = 'SAIDA' AND tipo_saida IS NOT NULL AND origem IS NULL AND valor IS NULL)
);
