-- US29/#291: validar ou cancelar nota. Não existe recusa; a decisão negativa é o cancelamento, com justificativa.
ALTER TABLE notas RENAME COLUMN justificativa_recusa TO justificativa_cancelamento;

-- Lock otimista: de duas decisões simultâneas sobre a mesma nota, só a primeira é aplicada.
ALTER TABLE notas ADD COLUMN versao BIGINT NOT NULL DEFAULT 0;
