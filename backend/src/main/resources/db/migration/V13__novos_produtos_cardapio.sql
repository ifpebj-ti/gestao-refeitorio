-- Migration V13: Adiciona novos produtos e insumos baseados no cardápio real do refeitório IFPE
-- (Pão francês em unidades, batata doce, macaxeira, jerimum, pepino, café/achocolatado, carne suína, feijão preto, etc.)

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Pão Francês', 'Grãos & Cereais', 'Und', 0.000, 0.60, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Pão Francês');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Feijão Preto', 'Grãos & Cereais', 'Kg', 0.000, 7.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Feijão Preto');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Milho para Mungunzá', 'Grãos & Cereais', 'Kg', 0.000, 5.20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Milho para Mungunzá');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Farofa Pronta / Temperada', 'Grãos & Cereais', 'Kg', 0.000, 6.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Farofa Pronta / Temperada');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Batata Doce', 'Hortifrúti', 'Kg', 0.000, 4.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Batata Doce');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Macaxeira (Aipim)', 'Hortifrúti', 'Kg', 0.000, 4.20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Macaxeira (Aipim)');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Jerimum (Abóbora Regional)', 'Hortifrúti', 'Kg', 0.000, 3.80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Jerimum (Abóbora Regional)');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Pepino', 'Hortifrúti', 'Kg', 0.000, 3.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Pepino');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Carne Suína (Picadinho/Lombo)', 'Proteínas & Frios', 'Kg', 0.000, 22.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Carne Suína (Picadinho/Lombo)');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Filé de Frango', 'Proteínas & Frios', 'Kg', 0.000, 19.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Filé de Frango');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Isca de Frango', 'Proteínas & Frios', 'Kg', 0.000, 19.80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Isca de Frango');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Achocolatado em Pó', 'Especificações & Condimentos', 'Kg', 0.000, 14.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Achocolatado em Pó');

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Chocolate em Pó', 'Especificações & Condimentos', 'Kg', 0.000, 18.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE nome = 'Chocolate em Pó');
