# Guia de Execução, Configuração e Operação

Este guia cobre como configurar, rodar e testar o projeto localmente (Windows/Docker Desktop),
e a diferença entre o ambiente de desenvolvimento e produção. Baseado nos arquivos reais do
repositório: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`,
`docker-compose.override.yml`, `docker-compose.prod.yml`, `.env.example` e `backend/pom.xml`.

> Para arquitetura de código, camadas do backend e convenções, ver `README.md` e o `CLAUDE.md`
> (local, não versionado). Este guia é só sobre **rodar** o projeto, não sobre como o código é
> organizado.

## 1. Pré-requisitos

| Ferramenta | Versão | Obrigatório para |
|---|---|---|
| **Docker Desktop** | qualquer recente, com o motor Linux (WSL2 no Windows) | Rodar tudo via `docker compose`, e os testes de integração (Testcontainers) |
| **Java** | 21 (`java.version` no `pom.xml`) | Rodar o backend fora do Docker |
| **Maven** | 3.9+ | Compilar/rodar o backend fora do Docker |
| **Node.js** | 20 (mesma versão da imagem `node:20-alpine` do `frontend/Dockerfile`) | Rodar o frontend fora do Docker |

**Sobre o Maven:** este projeto **não tem `mvnw` (Maven Wrapper)** hoje — só o `pom.xml`. Isso
significa duas coisas:
- Se você tem Maven instalado (`mvn -version` funciona no terminal), pode rodar tudo direto:
  `mvn -pl backend test`, `mvn -pl backend spring-boot:run`, etc.
- Se **não tem** Maven instalado localmente, dá pra rodar qualquer comando Maven dentro de um
  container, usando a mesma imagem que o `backend/Dockerfile` usa pra build
  (`maven:3.9-eclipse-temurin-21`) — ver seção 5. Adicionar um `mvnw` ao projeto resolveria isso
  de vez, mas está fora do escopo deste guia.

## 2. Configurar o `.env`

Todas as credenciais e parâmetros de ambiente (senha do banco, segredo do JWT, credenciais OAuth
do Google, URL da API pro frontend) ficam num `.env` na raiz — **nunca commitado** (é só o
`.env.example` que fica versionado).

```powershell
cp .env.example .env
```

Depois, edite o `.env` e ajuste:

| Variável | O que é | Precisa mudar? |
|---|---|---|
| `DB_NAME`, `DB_USER` | Nome do banco e usuário do Postgres | Não, salvo preferência |
| `DB_PASSWORD` | Senha do Postgres | **Sim** — troque o valor de exemplo |
| `JWT_SECRET` | Segredo usado pra assinar os JWTs próprios da aplicação | **Sim, principalmente em produção** — mínimo 32 caracteres |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciais OAuth2 do Google (login é exclusivo via Google, ver `CLAUDE.md` seção 5) | **Sim** — sem isso o login não valida o `id_token` de verdade. Cria em https://console.cloud.google.com/apis/credentials |
| `NEXT_PUBLIC_API_URL` | URL que o frontend usa pra chamar o backend | Não, em dev local (já aponta pro `localhost:8080/api`) |

O frontend tem seu próprio arquivo de exemplo separado:

```powershell
cp frontend/.env.local.example frontend/.env.local
```

## 3. Subir tudo com Docker Compose (dev)

```powershell
docker compose up --build
```

O que acontece: o Compose carrega `docker-compose.yml` (definição dos serviços) **e**
automaticamente `docker-compose.override.yml` (não precisa passar `-f`, o Docker Compose sempre
mescla esse arquivo por convenção de nome). O override é só pra dev — ele expõe as portas pro seu
host:

- Backend: `http://localhost:8080` (Swagger em `/swagger-ui.html`, health check em
  `/actuator/health`)
- Frontend: `http://localhost:3000`
- Postgres: `localhost:5432` (útil pra conectar com um client de banco tipo DBeaver/pgAdmin)

O `backend` só sobe depois que o `db` responde saudável (`depends_on: condition: service_healthy`
no `docker-compose.yml`), então não tem corrida entre a migration do Flyway e o banco ainda não
estar pronto.

Pra parar tudo: `docker compose down` (os dados do Postgres persistem no volume `db_data`; use
`docker compose down -v` se quiser apagar o banco também).

## 4. Rodar só o backend localmente (banco em Docker)

Às vezes você quer rodar o backend direto pela IDE (debug, hot reload) mas ainda usar um Postgres
de verdade em vez de mockar tudo. Pra isso:

**4.1. Suba só o banco:**

```powershell
docker compose up -d db
```

Isso também carrega o `docker-compose.override.yml` automaticamente, então o Postgres fica
exposto em `localhost:5432` com as credenciais do seu `.env`.

**4.2. Rode o backend apontando pro Postgres do Docker:**

O `application.yml` já tem defaults (`localhost:5432`, banco `estoque_cozinha`, usuário/senha
`postgres`/`postgres`) — se o seu `.env` usa esses mesmos valores default, basta:

```powershell
cd backend
mvn spring-boot:run
```

Se você mudou `DB_PASSWORD` (o que é recomendado — ver seção 2), precisa exportar as variáveis
antes, pra baterem com o que está no `.env`:

```powershell
$env:DB_PASSWORD = "sua-senha-do-.env"
$env:JWT_SECRET = "seu-segredo-do-.env"
$env:GOOGLE_CLIENT_ID = "seu-client-id-do-.env"
cd backend
mvn spring-boot:run
```

(Ou configure essas variáveis de ambiente na sua IDE — IntelliJ/VS Code permitem isso na run
configuration, sem precisar exportar no terminal toda vez.)

O Flyway roda as migrations automaticamente na subida, contra esse mesmo Postgres do Docker.

## 5. Diferença entre dev e produção

Os três arquivos de Compose não têm todos o mesmo papel:

| Arquivo | Carregado automaticamente? | Papel |
|---|---|---|
| `docker-compose.yml` | Sim (é o arquivo base) | Define os 3 serviços (`db`, `backend`, `frontend`), variáveis de ambiente vindas do `.env`, dependências entre serviços. **Não expõe portas** — isso fica pros arquivos de cima. |
| `docker-compose.override.yml` | **Sim, sozinho** — é o comportamento padrão do Docker Compose quando você roda só `docker compose up` | Publica as portas pro host (`5432`, `8080`, `3000`), pra facilitar acesso local em dev. |
| `docker-compose.prod.yml` | **Não** — só entra se você citar explicitamente com `-f` | `restart: unless-stopped` nos serviços, `SPRING_PROFILES_ACTIVE: prod` no backend, `NODE_ENV: production` no frontend, e republica as portas (já que ao usar `-f` explícito o override deixa de entrar sozinho). |

Rodar em modo produção (local ou num servidor):

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Note que aqui você lista **só** o base + o prod — o `docker-compose.override.yml` fica de fora
porque passou a usar `-f` explicitamente (o carregamento automático do override só vale quando
você não especifica nenhum `-f`). Por isso o `docker-compose.prod.yml` republica as portas: sem
isso, os serviços não teriam nenhuma porta exposta.

## 6. Rodar os testes do backend

```powershell
mvn -pl backend test
```

**Pré-requisito importante: o Docker Desktop precisa estar rodando**, mesmo que você não use
`docker compose` pra nada. Os testes de integração (`*IntegrationTest`, `*RepositoryTest`) usam
[Testcontainers](https://testcontainers.com/): cada classe sobe um container `postgres:16-alpine`
de verdade, roda as migrations do Flyway nele, e só depois executa os testes — não usa H2 nem
banco em memória. Se o Docker não estiver acessível, esses testes falham na subida do container,
não por bug no código.

**Se você não tem Maven instalado localmente** (ver seção 1), rode dentro de um container Maven,
montando o socket do Docker pra que o Testcontainers consiga subir o Postgres a partir de dentro
desse container:

```powershell
docker run --rm `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -v "${PWD}/backend:/app" `
  -w /app `
  maven:3.9-eclipse-temurin-21 `
  mvn -B test
```

Isso funciona sem variáveis extras na maioria dos casos. Se der problema de rede entre o
container do Maven e o container do Postgres que o Testcontainers cria (ver seção 7), adicione:

```powershell
docker run --rm `
  -v /var/run/docker.sock:/var/run/docker.sock `
  -e TESTCONTAINERS_RYUK_DISABLED=true `
  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal `
  -v "${PWD}/backend:/app" `
  -w /app `
  maven:3.9-eclipse-temurin-21 `
  mvn -B test
```

## 7. Troubleshooting (Windows)

**`mvn` trava ou não é reconhecido**
Maven não está instalado / não está no `PATH`. Confirme com `Get-Command mvn` no PowerShell — se
não retornar nada, use o caminho via Docker da seção 6, ou instale o Maven e adicione ao `PATH`.

**`docker version` ou `docker ps` travam sem responder**
O Docker Desktop está com o daemon travado (acontece principalmente depois de matar processos do
Docker à força). Solução: encerrar todos os processos do Docker Desktop e reabrir:
```powershell
Stop-Process -Name "docker","com.docker.build","com.docker.backend","Docker Desktop" -Force -ErrorAction SilentlyContinue
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```
Espere o ícone da bandeja ficar "Engine running" antes de tentar de novo.

**Testcontainers: `exec format error` ao subir o `postgres:16-alpine`**
A imagem ficou corrompida/incompleta no cache local (comum se um pull anterior foi interrompido,
por exemplo ao reiniciar o Docker Desktop no meio de um download). Remova a imagem e deixe baixar
de novo:
```powershell
docker rmi postgres:16-alpine
```

**Testcontainers: `Could not connect to Ryuk at 172.17.0.1:...`**
Só acontece quando você roda o Maven **dentro** de um container (fallback da seção 6, sem Maven
local) — é uma limitação de rede do Docker Desktop pra containers "irmãos" tentarem se conectar
entre si. Contorno: adicionar `-e TESTCONTAINERS_RYUK_DISABLED=true` e
`-e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal` no `docker run` (exemplo completo na seção
6). Isso não acontece quando você tem Maven instalado localmente e roda `mvn -pl backend test`
direto, sem Docker aninhado.

**`docker run -v` com paths errados/misturados (Git Bash)**
No Git Bash (MSYS), argumentos que parecem paths Unix (`/var/run/docker.sock`, `-w /app`) às
vezes são "traduzidos" automaticamente pra paths do Windows, quebrando o comando. Prefixe o
comando com `MSYS_NO_PATHCONV=1` pra desligar essa conversão automática, e use paths absolutos do
Windows (`D:/pasta/backend`) pros volumes que precisam apontar pro host.

**Porta já em uso (`5432`, `8080` ou `3000`)**
Outro processo (um Postgres instalado localmente, outro projeto, etc.) já está usando a porta.
Pare o outro processo ou pare o compose (`docker compose down`) antes de subir de novo — os três
arquivos de Compose sempre tentam publicar essas mesmas portas.

**Login via Google não funciona mesmo com tudo rodando**
Confira se `GOOGLE_CLIENT_ID` no `.env` está preenchido com um Client ID real (não vazio) — sem
isso, o backend nunca consegue validar o `id_token` contra a audiência esperada, e todo login
retorna 401.
