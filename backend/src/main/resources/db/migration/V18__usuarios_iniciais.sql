-- Carga inicial de usuários com perfis para homologação e administração do sistema.
-- Garante que ambientes novos (como na OCI) subam com contas válidas para autenticação via Google.
INSERT INTO usuarios (id, nome, email, perfil, ativo)
VALUES
    ('7c139eb0-bd2b-4692-840e-29e517058a20', 'Raphaela Samille', 'samramalho4@gmail.com', 'ADMIN', true),
    ('b1ff4806-93f9-4ad1-82b2-b56671dfa721', 'Raphinha', 'rsro@discente.ifpe.edu.br', 'NUTRICIONISTA', true),
    ('3f5ebd20-ea67-4d77-83e7-a59b348f311d', 'Sami Cozinheira', 'contasqualquer1313@gmail.com', 'COZINHA', true)
ON CONFLICT (email) DO NOTHING;
