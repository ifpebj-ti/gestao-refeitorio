-- Restaura os locais padrão da V4 em bancos onde a tabela foi esvaziada por fora das migrations (#473).
-- Mesmos UUIDs da V4, que o frontend referencia. ON CONFLICT sem alvo cobre conflito de id e de nome,
-- então num banco que ainda tem os locais nada muda.
INSERT INTO locais_armazenamento (id, nome) VALUES
    ('eddeb319-7af8-4d68-bd88-8a739c968c74', 'Despensa'),
    ('e10aa4e1-9b74-4791-8b01-1a8efd93af8c', 'Congelados/Refrigerados')
ON CONFLICT DO NOTHING;
