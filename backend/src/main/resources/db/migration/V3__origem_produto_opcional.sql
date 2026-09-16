-- O cadastro de produto (US04/#74) não coleta mais "origem" nesse momento:
-- conceitualmente esse dado pertence à Movimentacao (origem de uma entrada),
-- não ao cadastro do produto em si. Ver nota na issue #74.
ALTER TABLE produtos ALTER COLUMN origem DROP NOT NULL;
