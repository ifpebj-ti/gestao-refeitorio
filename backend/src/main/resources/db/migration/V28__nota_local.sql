-- US33/#293: nota local, emitida pela cozinha para entregas sem documento próprio (produção interna, doações).
-- As notas que já existem foram recebidas de terceiros, então ficam como EXTERNA.
ALTER TABLE notas ADD COLUMN tipo VARCHAR(10) NOT NULL DEFAULT 'EXTERNA'
    CHECK (tipo IN ('EXTERNA', 'LOCAL'));

-- Nome de quem entregou, em texto livre (como producoes_internas.responsavel_setor); só nas notas locais.
ALTER TABLE notas ADD COLUMN responsavel_entrega VARCHAR(150);

-- O número gerado da nota local é único no sistema inteiro; o das externas continua único só por remetente.
CREATE UNIQUE INDEX uk_notas_numero_local ON notas (numero) WHERE tipo = 'LOCAL';

-- Último número emitido em cada ano (NL-AAAA-NNNN). A linha é travada durante a emissão, para que duas
-- emissões simultâneas não gerem o mesmo número.
CREATE TABLE nota_local_sequencias (
    ano INTEGER PRIMARY KEY,
    ultimo_numero INTEGER NOT NULL
);
