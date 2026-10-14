-- Migration V15: Correção de encoding UTF-8, eliminação de duplicidades e padronização oficial de categorias
SET client_encoding = 'UTF8';

-- 1. Remover registros duplicados criados com encoding corrompido que não possuem movimentações
DELETE FROM produtos WHERE id = 'c822872d-c9e3-4a68-8af7-69fe00078029';
DELETE FROM produtos WHERE id = 'cf42dc09-c9ea-4b06-924a-f7d1dd11d907';
DELETE FROM produtos WHERE id = 'fdba0886-85ff-4307-999a-ae177e94ac0b';
DELETE FROM produtos WHERE id = 'df57943a-ded5-46ad-8675-6dd4effc9ecb';
DELETE FROM produtos WHERE id = '7f07a5d5-21c4-4fc8-976f-380ac3a4e58c';
DELETE FROM produtos WHERE id = '99a4ca33-3165-4e35-833f-8e338ef839b9';
DELETE FROM produtos WHERE id = 'cc2e8291-8ff9-49af-a513-04183cbe2568';
DELETE FROM produtos WHERE id = '28d9f7f2-eb92-4a13-a58a-9c8436cdbb01';

-- 2. Corrigir nomes de produtos com caracteres acentuados corrompidos (V14 e V8)
UPDATE produtos SET nome = 'Açúcar Mascavo' WHERE id = '2323e521-2183-447c-8482-9ef32ee8f8b7';
UPDATE produtos SET nome = 'Alho-Poró' WHERE id = 'f5baad58-39d7-45e5-84b9-a41ab8cafcec';
UPDATE produtos SET nome = 'Bicarbonato de Sódio' WHERE id = '4ec6dacb-0db9-4856-9a33-92b634763033';
UPDATE produtos SET nome = 'Bisteca Suína' WHERE id = '45f1a841-e7b2-4834-a1cf-8c40c8d37f28';
UPDATE produtos SET nome = 'Brócolis' WHERE id = 'f603b05c-ac69-42ce-867b-9809899ca471';
UPDATE produtos SET nome = 'Canela em Pó' WHERE id = '139145d3-660e-48b4-9146-a11096f24889';
UPDATE produtos SET nome = 'Carne Bovina (Músculo em Cubos)' WHERE id = '2177ed19-ff96-4ea4-8ee9-9291a02914e2';
UPDATE produtos SET nome = 'Carne Moída' WHERE id = 'f6f3a449-0822-440b-80e7-e71971086e61';
UPDATE produtos SET nome = 'Carne Suína (Picadinho/Lombo)' WHERE id = '6e35645e-1438-4fec-b9f6-2de7093a7eca';
UPDATE produtos SET nome = 'Chá de Camomila' WHERE id = '3756d817-e23f-4e78-9e58-69324545eb54';
UPDATE produtos SET nome = 'Chá de Erva-Doce' WHERE id = 'f2be1d52-6ff8-4ff7-ba03-34e857dd8d0f';
UPDATE produtos SET nome = 'Chá Preto' WHERE id = 'a3e74ff1-2b10-410a-9d95-88849b29cbdf';
UPDATE produtos SET nome = 'Costelinha Suína' WHERE id = '3e77c886-e752-465e-979c-3632c522019c';
UPDATE produtos SET nome = 'Cravo-da-Índia' WHERE id = 'f0357a73-4ca4-48f9-b317-833127b70f4f';
UPDATE produtos SET nome = 'Curry em Pó' WHERE id = '9df7931c-03e9-4b8b-a51a-1a1fe75a0300';
UPDATE produtos SET nome = 'Essência de Baunilha' WHERE id = '938cd14b-2695-4cf5-88ae-62ef74ef0f05';
UPDATE produtos SET nome = 'Fígado Bovino' WHERE id = '13005d01-3aa0-4618-9876-15e04b6e1bde';
UPDATE produtos SET nome = 'Farinha de Milho (Fubá)' WHERE id = 'abf58397-11a5-448a-9e0f-7d5aaa916f70';
UPDATE produtos SET nome = 'Feijão Fradinho' WHERE id = 'be055fbd-843b-420c-a5b7-3f7942e172bb';
UPDATE produtos SET nome = 'Feijão Preto' WHERE id = '18e5c84c-8b31-4bac-8a03-5652050cef4a';
UPDATE produtos SET nome = 'Feijão Verde' WHERE id = '6ecbd29a-c720-46be-944a-d1c339530dce';
UPDATE produtos SET nome = 'Fermento Biológico Seco' WHERE id = '6b32b011-0741-45cf-ba30-b3278479efe1';
UPDATE produtos SET nome = 'Fermento Químico em Pó' WHERE id = '40b0b715-4a66-4d80-bf69-18d2d879d57e';
UPDATE produtos SET nome = 'Filé de Frango' WHERE id = '867980eb-c475-4e85-b3c2-4dda41476d3c';
UPDATE produtos SET nome = 'Gengibre em Pó' WHERE id = '0752dbd9-5294-485f-857a-7c43eab760a9';
UPDATE produtos SET nome = 'Grão de Bico' WHERE id = 'b3d78b92-1ae4-4b15-8a5b-e64f5f5e78d2';
UPDATE produtos SET nome = 'Hortelã Seca' WHERE id = '1330e673-1ea9-4577-ace5-2b9bf7e69c16';
UPDATE produtos SET nome = 'Jerimum (Abóbora Regional)' WHERE id = '29d53e6c-4262-455f-b042-8ec9aafc43ce';
UPDATE produtos SET nome = 'Leite em Pó Integral' WHERE id = '89e512f0-e804-4f94-8b29-b6152784fbe0';
UPDATE produtos SET nome = 'Limão Taiti' WHERE id = '91258c79-19e3-4c9e-8c26-97fc1d9b5299';
UPDATE produtos SET nome = 'Linhaça Dourada' WHERE id = '00e1eaee-af40-440a-aebb-d9b848959c9e';
UPDATE produtos SET nome = 'Maçã Nacional' WHERE id = 'eabf5cd7-33b8-4a98-b40a-677b5890cd4b';
UPDATE produtos SET nome = 'Macarrão Parafuso' WHERE id = '0850fbe0-e2aa-49a2-a054-c089e6359f69';
UPDATE produtos SET nome = 'Macarrão Penne' WHERE id = '39b682ee-e8c7-4203-b80d-483b391653c2';
UPDATE produtos SET nome = 'Mamão' WHERE id = '03a7b93b-d4df-4d0c-b573-4c0add45fe4f';
UPDATE produtos SET nome = 'Manjericão Seco' WHERE id = '7a552118-31d9-4a67-aff0-08016025798b';
UPDATE produtos SET nome = 'Maracujá in natura' WHERE id = '250f4a57-b2e6-4843-8125-8fb76050f97a';
UPDATE produtos SET nome = 'Melão Amarelo' WHERE id = '6d005923-dcd8-413c-ac13-84821cb43ec5';
UPDATE produtos SET nome = 'Milho para Mungunzá' WHERE id = '786085e0-6ac0-4c3a-b8db-41e624e8b95d';
UPDATE produtos SET nome = 'Molho Inglês' WHERE id = '93f4e673-6366-409f-9639-7718e3b89215';
UPDATE produtos SET nome = 'Molho de Tomate (Sachê)' WHERE id = 'de8c38f4-4214-4949-a46c-03a39fd78221';
UPDATE produtos SET nome = 'Mungunzá Doce' WHERE id = '5c7826d4-7e9b-4170-9bc2-0601e1ffe1e4';
UPDATE produtos SET nome = 'Noz-Moscada Moída' WHERE id = 'a86e096a-f60a-433b-b8b3-9b79d5b26765';
UPDATE produtos SET nome = 'Orégano' WHERE id = '22f5c6d9-7810-4866-89d5-721758cbe8c6';
UPDATE produtos SET nome = 'Ovo de Galinha (Dúzia)' WHERE id = '91175377-9d04-47a4-98b9-49cf0b1980f3';
UPDATE produtos SET nome = 'Pão Doce' WHERE id = '5ec559b9-eb1f-4f97-8173-3fe31c32a16e';
UPDATE produtos SET nome = 'Pão de Forma' WHERE id = 'f4fdffad-8472-4655-a7c4-7079233dde35';
UPDATE produtos SET nome = 'Pão Francês' WHERE id = '8df121c6-4ba3-4e40-8760-ad6c27b64e69';
UPDATE produtos SET nome = 'Páprica Defumada' WHERE id = 'b2e83a9a-ee23-4fc2-a62f-013f984777e5';
UPDATE produtos SET nome = 'Páprica Doce' WHERE id = '7d1b59af-f28f-4a4f-afc0-909dad9a1717';
UPDATE produtos SET nome = 'Páprica Picante' WHERE id = 'fa7fc4eb-b3ad-4639-814c-1df9a983e681';
UPDATE produtos SET nome = 'Peixe em Filé (Merluza)' WHERE id = 'f5e10091-2f39-4d3a-9dbf-e05a46950e1a';
UPDATE produtos SET nome = 'Peixe em Filé (Tilápia)' WHERE id = '2acf1191-5b54-4ba6-8605-0db0a193fd55';
UPDATE produtos SET nome = 'Pimentão' WHERE id = '13139b43-e557-4376-8bc9-499fd342d6a4';
UPDATE produtos SET nome = 'Polpa de Fruta (Maracujá)' WHERE id = '4202c9b9-c3c4-4e44-946c-af32aac4e108';
UPDATE produtos SET nome = 'Proteína de Soja Texturizada' WHERE id = '052e4b44-7eac-4937-b311-84d4f7899a7b';
UPDATE produtos SET nome = 'Purê de Batata' WHERE id = '1f4db5a0-c485-45d4-85e2-2281605be629';
UPDATE produtos SET nome = 'Purê de Jerimum' WHERE id = 'd71cb64e-b52d-4309-ba66-4e4d791c0bfe';
UPDATE produtos SET nome = 'Rúcula' WHERE id = '39087fb8-d558-4080-9c94-4cda62761e98';
UPDATE produtos SET nome = 'Requeijão Cremoso' WHERE id = '7b19f315-5c63-4d2d-a739-e4030b814099';
UPDATE produtos SET nome = 'Água Mineral' WHERE id = 'efa6e6f7-6b3b-4fd5-94a3-48ef79b8d98f';
UPDATE produtos SET nome = 'Óleo Vegetal' WHERE id = '16d7a3df-0638-424c-8bda-016c8ca77c9e';

-- 3. Padronizar estritamente todas as categorias para as 5 oficiais com acentuação UTF-8
UPDATE produtos SET categoria = 'Grãos & Cereais' WHERE LOWER(categoria) LIKE '%gr%' OR LOWER(categoria) LIKE '%cereal%' OR LOWER(categoria) LIKE '%cereais%';
UPDATE produtos SET categoria = 'Proteínas & Frios' WHERE LOWER(categoria) LIKE '%prot%' OR LOWER(categoria) LIKE '%frio%';
UPDATE produtos SET categoria = 'Hortifrúti' WHERE LOWER(categoria) LIKE '%hort%';
UPDATE produtos SET categoria = 'Laticínios' WHERE LOWER(categoria) LIKE '%lat%';
UPDATE produtos SET categoria = 'Especificações & Condimentos' WHERE LOWER(categoria) LIKE '%espec%' OR LOWER(categoria) LIKE '%condimento%';

-- 4. Padronizar unidades de medida (ex: Maço com ç)
UPDATE produtos SET unidade_medida = 'Maço' WHERE unidade_medida LIKE 'Ma%o';
