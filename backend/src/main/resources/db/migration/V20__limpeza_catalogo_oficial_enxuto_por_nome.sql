-- Migration V20: Limpeza definitiva do catálogo oficial por nome
-- Remove produtos excedentes na OCI/produção deixados pela V16 (que utilizou UUIDs locais em vez de nomes)
SET client_encoding = 'UTF8';

-- 1. Padronizar nomes com pequenas variações de pontuação
UPDATE produtos SET nome = 'Alho-Poró' WHERE LOWER(TRIM(nome)) = 'alho poró';

-- 2. Tabela temporária com os 86 produtos oficiais
CREATE TEMP TABLE IF NOT EXISTS tmp_catalogo_oficial (
    nome TEXT PRIMARY KEY
);

INSERT INTO tmp_catalogo_oficial (nome) VALUES
    ('abóbora'),
    ('achocolatado em pó'),
    ('alface americana'),
    ('alface crespa'),
    ('alho in natura'),
    ('alho triturado'),
    ('alho-poró'),
    ('amido de milho'),
    ('arroz branco'),
    ('arroz integral'),
    ('arroz parboilizado'),
    ('azeite de oliva'),
    ('açafrão'),
    ('açúcar cristal'),
    ('açúcar mascavo'),
    ('bacon'),
    ('banana'),
    ('batata doce'),
    ('batata inglesa'),
    ('beterraba'),
    ('biscoito cream cracker'),
    ('biscoito maria'),
    ('brócolis'),
    ('café'),
    ('caldo de carne'),
    ('caldo de galinha'),
    ('carne bovina (acém/cozido)'),
    ('carne bovina (patinho/moída)'),
    ('carne moída'),
    ('carne suína (picadinho/lombo)'),
    ('cebola'),
    ('cebolinha'),
    ('cenoura'),
    ('charque'),
    ('chocolate em pó'),
    ('coentro'),
    ('coloral'),
    ('cominho'),
    ('couve'),
    ('coxa de frango'),
    ('creme de leite'),
    ('cuscuz'),
    ('ervilha'),
    ('extrato de tomate'),
    ('farinha de mandioca (farofa)'),
    ('farofa pronta / temperada'),
    ('feijão carioca'),
    ('feijão macassar'),
    ('feijão preto'),
    ('filé de frango'),
    ('flocão de milho (cuscuz)'),
    ('folha de louro'),
    ('isca de frango'),
    ('jerimum (abóbora regional)'),
    ('laranja pera'),
    ('leite de coco'),
    ('leite in natura'),
    ('linguiça calabresa'),
    ('macarrão (sopa)'),
    ('macarrão espaguete'),
    ('macaxeira (aipim)'),
    ('mamão'),
    ('margarina'),
    ('maçã nacional'),
    ('melancia'),
    ('milho verde'),
    ('milho para mungunzá'),
    ('molho inglês'),
    ('molho shoyu'),
    ('mungunzá doce'),
    ('orégano'),
    ('ovos pasteurizados / cartela'),
    ('peito de frango'),
    ('pepino'),
    ('pimenta do reino'),
    ('pimentão'),
    ('pão francês'),
    ('queijo mussarela'),
    ('queijo ralado'),
    ('sal'),
    ('sobrecoxa de frango'),
    ('tapioca (goma pronta)'),
    ('tomate'),
    ('vinagre'),
    ('água mineral'),
    ('óleo vegetal')
ON CONFLICT (nome) DO NOTHING;

-- 3. Limpar dependências de itens de cardápio caso algum produto excedente tenha sido vinculado
DELETE FROM itens_cardapio
WHERE produto_id IN (
    SELECT id FROM produtos
    WHERE LOWER(TRIM(nome)) NOT IN (SELECT nome FROM tmp_catalogo_oficial)
);

-- 4. Limpar dependências de produções internas
DELETE FROM producoes_internas
WHERE movimentacao_id IN (
    SELECT id FROM movimentacoes
    WHERE produto_id IN (
        SELECT id FROM produtos
        WHERE LOWER(TRIM(nome)) NOT IN (SELECT nome FROM tmp_catalogo_oficial)
    )
);

-- 5. Limpar fotos de movimentações
DELETE FROM movimentacao_fotos
WHERE movimentacao_id IN (
    SELECT id FROM movimentacoes
    WHERE produto_id IN (
        SELECT id FROM produtos
        WHERE LOWER(TRIM(nome)) NOT IN (SELECT nome FROM tmp_catalogo_oficial)
    )
);

-- 6. Limpar movimentações de produtos que não pertencem ao catálogo
DELETE FROM movimentacoes
WHERE produto_id IN (
    SELECT id FROM produtos
    WHERE LOWER(TRIM(nome)) NOT IN (SELECT nome FROM tmp_catalogo_oficial)
);

-- 7. Deletar todos os produtos que não pertencem ao catálogo oficial
DELETE FROM produtos
WHERE LOWER(TRIM(nome)) NOT IN (SELECT nome FROM tmp_catalogo_oficial);

-- 8. Limpar tabela temporária
DROP TABLE IF EXISTS tmp_catalogo_oficial;
