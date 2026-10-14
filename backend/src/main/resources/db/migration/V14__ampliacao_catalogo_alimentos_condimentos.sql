-- Migration V14: Ampliação abrangente do catálogo oficial de produtos, alimentos, refeições, condimentos e especiarias
-- Adequado para refeitório IFPE (atendendo café da manhã, almoço, jantar, lanches e buffet de saladas)

-- ==========================================
-- 1. REFEIÇÕES E PREPARAÇÕES BÁSICAS
-- ==========================================
INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Cuscuz', 'Grãos & Cereais', 'Kg', 0.000, 3.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Cuscuz'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Cuscuz com Ovo', 'Grãos & Cereais', 'Kg', 0.000, 6.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Cuscuz com Ovo'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Cuscuz Temperado', 'Grãos & Cereais', 'Kg', 0.000, 8.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Cuscuz Temperado'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Tapioca (Goma Pronta)', 'Grãos & Cereais', 'Kg', 0.000, 7.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Tapioca (Goma Pronta)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Purê de Batata', 'Hortifrúti', 'Kg', 0.000, 6.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Purê de Batata'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Purê de Jerimum', 'Hortifrúti', 'Kg', 0.000, 5.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Purê de Jerimum'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Sopa de Legumes com Carne', 'Proteínas & Frios', 'Kg', 0.000, 12.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Sopa de Legumes com Carne'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Canja de Galinha', 'Proteínas & Frios', 'Kg', 0.000, 10.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Canja de Galinha'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Mungunzá Doce', 'Grãos & Cereais', 'Kg', 0.000, 6.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Mungunzá Doce'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Mingau de Aveia', 'Grãos & Cereais', 'Kg', 0.000, 5.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Mingau de Aveia'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Mingau de Milho (Canjica)', 'Grãos & Cereais', 'Kg', 0.000, 5.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Mingau de Milho (Canjica)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Pão de Forma', 'Grãos & Cereais', 'Pct', 0.000, 7.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Pão de Forma'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Pão Doce', 'Grãos & Cereais', 'Und', 0.000, 1.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Pão Doce'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Torrada', 'Grãos & Cereais', 'Pct', 0.000, 5.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Torrada'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Bolo Caseiro', 'Grãos & Cereais', 'Kg', 0.000, 15.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Bolo Caseiro'));

-- ==========================================
-- 2. GRÃOS, CEREAIS, FARINHAS E MASSAS
-- ==========================================
INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Arroz Branco', 'Grãos & Cereais', 'Kg', 0.000, 5.20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Arroz Branco'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Arroz Integral', 'Grãos & Cereais', 'Kg', 0.000, 6.80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Arroz Integral'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Feijão Fradinho', 'Grãos & Cereais', 'Kg', 0.000, 7.20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Feijão Fradinho'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Feijão Verde', 'Grãos & Cereais', 'Kg', 0.000, 12.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Feijão Verde'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Grão de Bico', 'Grãos & Cereais', 'Kg', 0.000, 14.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Grão de Bico'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Lentilha', 'Grãos & Cereais', 'Kg', 0.000, 11.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Lentilha'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Farinha de Trigo Especial', 'Grãos & Cereais', 'Kg', 0.000, 4.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Farinha de Trigo Especial'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Farinha de Trigo com Fermento', 'Grãos & Cereais', 'Kg', 0.000, 4.80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Farinha de Trigo com Fermento'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Farinha de Milho (Fubá)', 'Grãos & Cereais', 'Kg', 0.000, 3.20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Farinha de Milho (Fubá)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Aveia em Flocos', 'Grãos & Cereais', 'Kg', 0.000, 8.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Aveia em Flocos'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Macarrão Parafuso', 'Grãos & Cereais', 'Kg', 0.000, 4.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Macarrão Parafuso'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Macarrão Penne', 'Grãos & Cereais', 'Kg', 0.000, 4.80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Macarrão Penne'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Polvilho Doce', 'Grãos & Cereais', 'Kg', 0.000, 7.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Polvilho Doce'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Polvilho Azedo', 'Grãos & Cereais', 'Kg', 0.000, 7.20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Polvilho Azedo'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Milho de Pipoca', 'Grãos & Cereais', 'Kg', 0.000, 5.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Milho de Pipoca'));

-- ==========================================
-- 3. PROTEÍNAS, CARNES, PEIXES E FRIOS
-- ==========================================
INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Carne Moída', 'Proteínas & Frios', 'Kg', 0.000, 32.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Carne Moída'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Carne Bovina (Músculo em Cubos)', 'Proteínas & Frios', 'Kg', 0.000, 28.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Carne Bovina (Músculo em Cubos)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Carne Bovina (Alcatra)', 'Proteínas & Frios', 'Kg', 0.000, 39.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Carne Bovina (Alcatra)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Carne de Sol', 'Proteínas & Frios', 'Kg', 0.000, 44.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Carne de Sol'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Fígado Bovino', 'Proteínas & Frios', 'Kg', 0.000, 16.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Fígado Bovino'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Sobrecoxa de Frango', 'Proteínas & Frios', 'Kg', 0.000, 13.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Sobrecoxa de Frango'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Frango a Passarinho', 'Proteínas & Frios', 'Kg', 0.000, 12.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Frango a Passarinho'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Bisteca Suína', 'Proteínas & Frios', 'Kg', 0.000, 21.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Bisteca Suína'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Costelinha Suína', 'Proteínas & Frios', 'Kg', 0.000, 25.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Costelinha Suína'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Peixe em Filé (Tilápia)', 'Proteínas & Frios', 'Kg', 0.000, 32.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Peixe em Filé (Tilápia)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Peixe em Filé (Merluza)', 'Proteínas & Frios', 'Kg', 0.000, 26.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Peixe em Filé (Merluza)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Peixe em Postas', 'Proteínas & Frios', 'Kg', 0.000, 24.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Peixe em Postas'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Atum em Conserva', 'Proteínas & Frios', 'Lata', 0.000, 7.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Atum em Conserva'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Sardinha em Conserva', 'Proteínas & Frios', 'Lata', 0.000, 4.80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Sardinha em Conserva'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Presunto Cozido', 'Proteínas & Frios', 'Kg', 0.000, 26.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Presunto Cozido'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Salsicha Hot Dog', 'Proteínas & Frios', 'Kg', 0.000, 11.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Salsicha Hot Dog'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Ovo de Galinha (Dúzia)', 'Proteínas & Frios', 'Und', 0.000, 10.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Ovo de Galinha (Dúzia)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Proteína de Soja Texturizada', 'Proteínas & Frios', 'Kg', 0.000, 15.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Proteína de Soja Texturizada'));

-- ==========================================
-- 4. HORTIFRÚTI (LEGUMES, FOLHAS E FRUTAS)
-- ==========================================
INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Alface Crespa', 'Hortifrúti', 'Maço', 0.000, 3.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Alface Crespa'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Alface Americana', 'Hortifrúti', 'Maço', 0.000, 3.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Alface Americana'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Rúcula', 'Hortifrúti', 'Maço', 0.000, 3.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Rúcula'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Repolho Branco', 'Hortifrúti', 'Kg', 0.000, 3.80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Repolho Branco'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Repolho Roxo', 'Hortifrúti', 'Kg', 0.000, 4.80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Repolho Roxo'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Chuchu', 'Hortifrúti', 'Kg', 0.000, 3.20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Chuchu'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Abobrinha', 'Hortifrúti', 'Kg', 0.000, 4.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Abobrinha'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Quiabo', 'Hortifrúti', 'Kg', 0.000, 6.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Quiabo'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Maxixe', 'Hortifrúti', 'Kg', 0.000, 5.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Maxixe'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Inhame', 'Hortifrúti', 'Kg', 0.000, 7.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Inhame'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Vagem', 'Hortifrúti', 'Kg', 0.000, 8.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Vagem'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Brócolis', 'Hortifrúti', 'Kg', 0.000, 9.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Brócolis'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Couve-Flor', 'Hortifrúti', 'Kg', 0.000, 8.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Couve-Flor'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Espinafre', 'Hortifrúti', 'Maço', 0.000, 3.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Espinafre'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Laranja Pera', 'Hortifrúti', 'Kg', 0.000, 4.20, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Laranja Pera'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Maçã Nacional', 'Hortifrúti', 'Kg', 0.000, 8.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Maçã Nacional'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Melancia', 'Hortifrúti', 'Kg', 0.000, 2.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Melancia'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Melão Amarelo', 'Hortifrúti', 'Kg', 0.000, 4.80, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Melão Amarelo'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Mamão', 'Hortifrúti', 'Kg', 0.000, 4.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Mamão'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Abacaxi', 'Hortifrúti', 'Und', 0.000, 5.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Abacaxi'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Manga', 'Hortifrúti', 'Kg', 0.000, 4.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Manga'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Goiaba', 'Hortifrúti', 'Kg', 0.000, 5.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Goiaba'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Limão Taiti', 'Hortifrúti', 'Kg', 0.000, 4.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Limão Taiti'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Tangerina', 'Hortifrúti', 'Kg', 0.000, 5.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Tangerina'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Maracujá in natura', 'Hortifrúti', 'Kg', 0.000, 7.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Maracujá in natura'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Polpa de Fruta (Maracujá)', 'Hortifrúti', 'Kg', 0.000, 14.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Polpa de Fruta (Maracujá)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Polpa de Fruta (Goiaba)', 'Hortifrúti', 'Kg', 0.000, 10.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Polpa de Fruta (Goiaba)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Polpa de Fruta (Acerola)', 'Hortifrúti', 'Kg', 0.000, 11.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Polpa de Fruta (Acerola)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Polpa de Fruta (Caju)', 'Hortifrúti', 'Kg', 0.000, 10.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Polpa de Fruta (Caju)'));

-- ==========================================
-- 5. LATICÍNIOS E DERIVADOS
-- ==========================================
INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Queijo Coalho', 'Laticínios', 'Kg', 0.000, 38.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Queijo Coalho'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Queijo Prato', 'Laticínios', 'Kg', 0.000, 42.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Queijo Prato'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Requeijão Cremoso', 'Laticínios', 'Kg', 0.000, 22.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Requeijão Cremoso'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Leite em Pó Integral', 'Laticínios', 'Kg', 0.000, 28.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Leite em Pó Integral'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Manteiga com Sal', 'Laticínios', 'Kg', 0.000, 34.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Manteiga com Sal'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Iogurte Batido', 'Laticínios', 'Lt', 0.000, 7.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Iogurte Batido'));

-- ==========================================
-- 6. CONDIMENTOS, ESPECIARIAS E MOLHOS
-- ==========================================
INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Páprica Doce', 'Especificações & Condimentos', 'g', 0.000, 7.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Páprica Doce'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Páprica Defumada', 'Especificações & Condimentos', 'g', 0.000, 8.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Páprica Defumada'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Páprica Picante', 'Especificações & Condimentos', 'g', 0.000, 7.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Páprica Picante'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Chimichurri', 'Especificações & Condimentos', 'g', 0.000, 9.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Chimichurri'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Curry em Pó', 'Especificações & Condimentos', 'g', 0.000, 8.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Curry em Pó'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Canela em Pó', 'Especificações & Condimentos', 'g', 0.000, 6.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Canela em Pó'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Canela em Pau', 'Especificações & Condimentos', 'g', 0.000, 7.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Canela em Pau'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Cravo-da-Índia', 'Especificações & Condimentos', 'g', 0.000, 9.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Cravo-da-Índia'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Noz-Moscada Moída', 'Especificações & Condimentos', 'g', 0.000, 10.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Noz-Moscada Moída'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Gengibre em Pó', 'Especificações & Condimentos', 'g', 0.000, 8.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Gengibre em Pó'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Alecrim Seco', 'Especificações & Condimentos', 'g', 0.000, 5.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Alecrim Seco'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Manjericão Seco', 'Especificações & Condimentos', 'g', 0.000, 5.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Manjericão Seco'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Hortelã Seca', 'Especificações & Condimentos', 'g', 0.000, 5.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Hortelã Seca'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Salsinha Desidratada', 'Especificações & Condimentos', 'g', 0.000, 6.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Salsinha Desidratada'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Pimenta Calabresa', 'Especificações & Condimentos', 'g', 0.000, 6.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Pimenta Calabresa'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Pimenta Biquinho em Conserva', 'Especificações & Condimentos', 'Vidro', 0.000, 8.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Pimenta Biquinho em Conserva'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Pimenta de Cheiro', 'Especificações & Condimentos', 'Kg', 0.000, 12.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Pimenta de Cheiro'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Alho Poró', 'Especificações & Condimentos', 'Kg', 0.000, 14.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Alho Poró'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Molho de Tomate (Sachê)', 'Especificações & Condimentos', 'Kg', 0.000, 6.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Molho de Tomate (Sachê)'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Ketchup', 'Especificações & Condimentos', 'Kg', 0.000, 9.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Ketchup'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Mostarda Amarela', 'Especificações & Condimentos', 'Kg', 0.000, 11.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Mostarda Amarela'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Maionese Tradicional', 'Especificações & Condimentos', 'Kg', 0.000, 10.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Maionese Tradicional'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Molho de Pimenta', 'Especificações & Condimentos', 'Vidro', 0.000, 4.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Molho de Pimenta'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Bicarbonato de Sódio', 'Especificações & Condimentos', 'Kg', 0.000, 8.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Bicarbonato de Sódio'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Fermento Químico em Pó', 'Especificações & Condimentos', 'Und', 0.000, 4.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Fermento Químico em Pó'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Fermento Biológico Seco', 'Especificações & Condimentos', 'Und', 0.000, 2.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Fermento Biológico Seco'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Essência de Baunilha', 'Especificações & Condimentos', 'Vidro', 0.000, 6.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Essência de Baunilha'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Gergelim Branco', 'Especificações & Condimentos', 'Kg', 0.000, 24.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Gergelim Branco'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Semente de Chia', 'Especificações & Condimentos', 'Kg', 0.000, 26.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Semente de Chia'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Linhaça Dourada', 'Especificações & Condimentos', 'Kg', 0.000, 18.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Linhaça Dourada'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Açúcar Mascavo', 'Especificações & Condimentos', 'Kg', 0.000, 7.50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Açúcar Mascavo'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Mel de Abelha', 'Especificações & Condimentos', 'Kg', 0.000, 32.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Mel de Abelha'));

INSERT INTO produtos (id, nome, categoria, unidade_medida, saldo_atual, valor_referencia, controla_validade)
SELECT gen_random_uuid(), 'Goiabada em Barra', 'Especificações & Condimentos', 'Kg', 0.000, 12.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM produtos WHERE LOWER(nome) = LOWER('Goiabada em Barra'));
