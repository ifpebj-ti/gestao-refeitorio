-- Login com usuário e senha (#365): hash BCrypt da senha local. Nulo = usuário só entra pelo Google.
ALTER TABLE usuarios ADD COLUMN senha_hash VARCHAR(100);
