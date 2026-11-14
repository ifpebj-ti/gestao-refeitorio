# Guia de Testes de Usuário (Validação Funcional e Usabilidade)

Este guia orienta a aplicação e validação prática do sistema **Gestão de Refeitório — IFPE *Campus* Belo Jardim** com usuários reais em ambiente homologado ou local. O objetivo é verificar se todos os fluxos principais atendem às necessidades operacionais da **Cozinha**, **Nutrição**, **Administração (TI)** e **Comunidade Acadêmica (Estudantes e Servidores)**.

---

## 1. Perfis de Usuário Avaliados

| Perfil | Papel no Campus | Escopo de Acesso no Sistema |
| :--- | :--- | :--- |
| **Administrador (`ADMIN`)** | Equipe de TI / Gestão de Acessos | Acesso exclusivo à **Gestão de Usuários** (`/usuarios`): cadastra e edita contas institucionais, ativa/desativa acessos e define, redefine ou remove senhas locais. |
| **Nutricionista (`NUTRICIONISTA`)** | Setor de Nutrição do Campus | Acesso completo aos módulos operacionais e gerenciais: **Consumo Diário** (`/consumo`), **Entradas & Estoque** (`/estoque`), **Cardápio Semanal** (`/cardapio`), **Transmissão TV** (`/cardapio-tv`), **Relatórios & Indicadores** (`/relatorios`) e **Central de Alertas** (`/alertas`). |
| **Cozinha (`COZINHA`)** | Equipe Operacional da Cozinha | Acesso focado na rotina diária: **Consumo Diário** (`/consumo`), **Central de Alertas** (`/alertas`) e visualização do painel de transmissão na TV da Cozinha (`/tv`). |
| **Estudante / Servidor (Visualização Pública)** | Comunidade Acadêmica no Refeitório | Visualização pública do cardápio do dia transmitido na Smart TV do Refeitório (`/tv/refeitorio`), sem necessidade de login. |

---

## 2. Roteiro de Execução da Sessão de Testes

1. **Preparação do Ambiente (5 min):**
   - Certifique-se de que a aplicação está acessível e com ao menos 1 conta ativa para cada perfil (`ADMIN`, `NUTRICIONISTA` e `COZINHA`).
   - Entregue ao participante o objetivo de cada cenário sem indicar onde clicar, observando a facilidade de navegação.
2. **Execução dos Cenários (20 a 30 min):**
   - O participante executa os cenários correspondentes ao seu perfil seguindo a tabela da **Seção 3**.
   - Peça ao participante para verbalizar dúvidas ou dificuldades encontradas (*think-aloud protocol*).
3. **Coleta de Resultados e Feedback (5 min):**
   - Preencha a **Tabela de Registro de Execução** (Seção 4) e o **Formulário de Feedback de Usabilidade** (Seção 5).

---

## 3. Cenários de Teste (10 Cenários Críticos)

### CT01 — Autenticação via Conta Google e Redirecionamento por Perfil (RBAC)
- **Perfil:** `ADMIN`, `NUTRICIONISTA` ou `COZINHA`
- **Pré-condição:** Usuário previamente cadastrado e ativo no sistema.
- **Passos:**
  1. Acessar a tela inicial (`/`).
  2. Clicar no botão **Continuar com Google** e selecionar a conta institucional/autorizada.
- **Resultado Esperado:** O sistema autentica o usuário e redireciona automaticamente o `ADMIN` para `/usuarios` e os perfis `NUTRICIONISTA` ou `COZINHA` para `/consumo`, exibindo na barra lateral apenas os menus permitidos para aquele perfil.

---

### CT02 — Login Local com Usuário (E-mail) e Senha e Tratamento de Erros
- **Perfil:** `COZINHA` ou `NUTRICIONISTA` (com senha local definida pelo Admin)
- **Pré-condição:** Usuário ativo com senha local configurada.
- **Passos:**
  1. Na tela inicial (`/`), clicar em **"Entrar com usuário e senha"**.
  2. Informar um e-mail com senha incorreta e clicar em **"Entrar"**.
  3. Verificar a mensagem de erro e informar em seguida o e-mail e a senha corretos.
  4. Clicar em **"Voltar"** antes ou após o teste para validar o retorno ao login Google.
- **Resultado Esperado:** Tentativa inválida exibe `"E-mail ou senha inválidos."` (ou `"Muitas tentativas. Tente novamente em alguns minutos."` após 5 falhas seguidas). Ao informar credenciais válidas, o usuário acessa o painel do seu perfil normalmente. Ao clicar em `"Voltar"`, o campo de senha é limpo e nunca fica salvo no navegador.

---

### CT03 — Cadastro de Novo Usuário e Gestão de Senha Local pelo Administrador
- **Perfil:** `ADMIN`
- **Pré-condição:** Estar autenticado como Administrador em `/usuarios`.
- **Passos:**
  1. Clicar em **"Novo Usuário"**, preencher Nome, E-mail e selecionar o perfil (`Cozinha`, `Nutricionista` ou `Administrador`).
  2. Opcionalmente definir uma senha local (mínimo de 12 caracteres) ou salvar apenas para login Google.
  3. Na tabela de usuários, localizar um usuário e clicar em **"Definir senha"** (ou **"Redefinir senha"**).
  4. Testar uma senha com menos de 12 caracteres (verificar bloqueio) e depois salvar uma senha válida de 12+ caracteres com confirmação.
- **Resultado Esperado:** O usuário aparece na listagem com a coluna **Senha** indicando **`Sim`**, podendo autenticar tanto via Google quanto com e-mail e senha. Caso o Admin acione **"Remover senha"** dentro do modal de redefinição, a coluna volta para **`Não`**.

---

### CT04 — Cadastro de Novo Produto e Configuração de Estoque Mínimo e Validade
- **Perfil:** `NUTRICIONISTA`
- **Pré-condição:** Estar autenticado como Nutricionista em **Entradas & Estoque** (`/estoque`).
- **Passos:**
  1. Abrir o formulário de novo produto/insumo.
  2. Informar nome (ex.: *Arroz Parboilizado*), categoria (*Grãos & Cereais*), unidade base (*Kg*), estoque mínimo e marcar se controla validade.
  3. Salvar o cadastro e consultar o produto na listagem.
- **Resultado Esperado:** O produto é criado com saldo inicial zero (ou atualizado), exibindo sua categoria, unidade de medida e parâmetro de estoque mínimo configurado.

---

### CT05 — Registro de Entrada de Mercadoria com Lote, Validade e Foto da Nota
- **Perfil:** `NUTRICIONISTA`
- **Pré-condição:** Produto cadastrado no catálogo.
- **Passos:**
  1. Em **Entradas & Estoque** (`/estoque`), selecionar a opção de registrar nova **Entrada**.
  2. Selecionar o insumo, o local de armazenamento (ex.: *Despensa Seca* ou *Câmara Fria*), a origem (*Externa*, *Agroindústria*, etc.), a quantidade, o valor, o lote e a data de validade.
  3. Anexar uma imagem (`JPEG` ou `PNG` de até 5 MB) da nota/comprovante e confirmar o lançamento.
- **Resultado Esperado:** O saldo total do produto e o saldo por local aumentam imediatamente na proporção informada, e a entrada passa a constar no histórico auditável.

---

### CT06 — Lançamento de Consumo Diário pela Cozinha (Conversão de Unidades)
- **Perfil:** `COZINHA` ou `NUTRICIONISTA`
- **Pré-condição:** Existir produto com saldo disponível em estoque.
- **Passos:**
  1. Acessar **Consumo Diário** (`/consumo`).
  2. Selecionar a data e a refeição no seletor (**Café**, **Almoço** ou **Jantar**).
  3. Informar a quantidade consumida de um insumo (testando inclusive informar em gramas `g` para um produto cuja base é `Kg`) e selecionar o local de saída.
  4. Confirmar o registro do consumo.
- **Resultado Esperado:** O sistema converte automaticamente a quantidade para a unidade base (ex.: `500 g` $\rightarrow$ `0,5 Kg`), abate o saldo do estoque e registra a saída no histórico da refeição.

---

### CT07 — Planejamento do Cardápio Semanal pela Nutricionista
- **Perfil:** `NUTRICIONISTA`
- **Pré-condição:** Estar autenticada e acessar **Cardápio Semanal** (`/cardapio`).
- **Passos:**
  1. Selecionar a semana e o dia desejado.
  2. Preencher os pratos principais, acompanhamentos, saladas e quantidades planejadas para **Café da Manhã**, **Almoço** e **Jantar**, adicionando uma observação (ex.: *Opção sem lactose*).
  3. Salvar o cardápio semanal.
- **Resultado Esperado:** O cardápio fica salvo e sincronizado imediatamente com a tela de Consumo Diário e com os painéis de transmissão das TVs.

---

### CT08 — Transmissão do Cardápio nas TVs da Cozinha e do Refeitório
- **Perfil:** `COZINHA`, `NUTRICIONISTA` e **Estudante / Servidor (Público)**
- **Pré-condição:** Cardápio do dia cadastrado.
- **Passos:**
  1. Acessar **Transmissão TV** (`/cardapio-tv`) e abrir os modos de exibição da **TV da Cozinha** (`/tv`) e da **TV do Refeitório** (`/tv/refeitorio`).
  2. Verificar a legibilidade à distância, a exibição da refeição atual e se a rota pública `/tv` permanece ativa sem redirecionar para a tela de login.
- **Resultado Esperado:** Os painéis exibem os pratos e observações do dia com alto contraste e atualização automática, permitindo que estudantes e servidores consultem o cardápio no refeitório e a equipe da cozinha acompanhe as quantidades planejadas.

---

### CT09 — Verificação da Central de Alertas (Estoque Baixo, Zerado e Validade Próxima)
- **Perfil:** `COZINHA` ou `NUTRICIONISTA`
- **Pré-condição:** Existir ao menos um produto com saldo abaixo do mínimo, zerado ou com lote vencendo em até 7 dias.
- **Passos:**
  1. Observar o contador numérico vermelho ao lado de **Central de Alertas** na barra lateral.
  2. Clicar em **Central de Alertas** (`/alertas`) e filtrar por tipo de alerta (*Estoque Zerado*, *Estoque Baixo* e *Validade Próxima*).
- **Resultado Esperado:** O sistema lista claramente os itens críticos com destaque visual de urgência, auxiliando na reposição e no uso prioritário de lotes próximos do vencimento (PVPS — *Primeiro que Vence, Primeiro que Sai*).

---

### CT10 — Geração de Relatórios Mensais e Exportação em PDF e Excel
- **Perfil:** `NUTRICIONISTA`
- **Pré-condição:** Existirem movimentações de entrada e saída registradas no período.
- **Passos:**
  1. Acessar **Relatórios & Indicadores** (`/relatorios`).
  2. Selecionar o período (data inicial e data final) e consultar a tabela consolidada e o gráfico de evolução de consumo.
  3. Clicar nos botões de exportação para **PDF** e **Excel (`.xlsx`)**.
- **Resultado Esperado:** Os indicadores e gráficos são atualizados para o intervalo escolhido e o navegador realiza o download dos arquivos `.pdf` e `.xlsx` contendo o balanço de entradas, saídas, produção interna e saldo final.

---

## 4. Modelo de Registro de Resultados (Checklist de Execução)

Utilize a tabela abaixo durante as sessões de teste com usuários para registrar o resultado de cada cenário:

| ID | Cenário | Perfil Testado | Nome do Testador | Data | Status (`Passou` / `Falhou` / `Com Ressalvas`) | Tempo / Dificuldade (1 a 5) | Observações / Evidências |
| :---: | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **CT01** | Login com Google e RBAC | `ADMIN` / `NUTRI` / `COZINHA` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |
| **CT02** | Login com usuário e senha (`401`/`429`) | `COZINHA` / `NUTRI` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |
| **CT03** | Gestão de usuários e senhas locais | `ADMIN` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |
| **CT04** | Cadastro de produto e estoque mínimo | `NUTRICIONISTA` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |
| **CT05** | Entrada de estoque com validade e foto | `NUTRICIONISTA` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |
| **CT06** | Consumo diário e conversão de unidades | `COZINHA` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |
| **CT07** | Planejamento do cardápio semanal | `NUTRICIONISTA` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |
| **CT08** | Visualização nas TVs (Cozinha e Refeitório) | `COZINHA` / `ESTUDANTE` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |
| **CT09** | Central de alertas (estoque e validade) | `COZINHA` / `NUTRI` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |
| **CT10** | Relatórios mensais e exportação PDF/Excel | `NUTRICIONISTA` | | `__/__/2026` | `[ ] Passou  [ ] Falhou` | | |

---

## 5. Modelo de Registro de Feedback Qualitativo (Usabilidade)

Ao final do teste com cada participante, registre a avaliação geral:

- **Participante / Perfil:** `__________________________________________________`
- **Dispositivo utilizado:** `( ) Desktop / Notebook   ( ) Smartphone / Tablet   ( ) Smart TV`
- **Avaliação de Usabilidade (1 = Muito difícil | 5 = Muito fácil):**
  - Clareza visual e leitura dos textos/tabelas: `[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]`
  - Facilidade para encontrar as ações principais no menu: `[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]`
  - Clareza das mensagens de confirmação e de erro: `[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]`
  - Responsividade e conforto de uso na tela utilizada: `[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]`
- **Perguntas Abertas:**
  1. *Qual tarefa você achou mais rápida e intuitiva de realizar?*
  2. *Em algum momento você ficou em dúvida sobre qual botão clicar ou o que significava alguma informação?*
  3. *Sugestão de melhoria para a rotina real do refeitório:*

