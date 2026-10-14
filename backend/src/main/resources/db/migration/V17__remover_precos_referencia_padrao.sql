-- Migration V17: Remover precos de referencia padrao do catalogo
-- Requisito: por padrao todos os produtos cadastrados nao devem ter preco de referencia.
-- Isso sera ajustado somente quando o nutricionista for alimentar os valores reais no dia a dia.
SET client_encoding = 'UTF8';

UPDATE produtos SET valor_referencia = NULL;
