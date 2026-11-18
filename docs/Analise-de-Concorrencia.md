# Análise de Concorrência — Sistema de Controle de Estoque da Cozinha (IFPE Belo Jardim)

## 1. Objetivo

Levantar soluções existentes de controle de estoque voltadas para cozinhas/*food service*, comparando funcionalidades com o que está previsto no MVP do projeto, e destacar os diferenciais da solução proposta para o contexto específico do IFPE Campus Belo Jardim (cozinha institucional/escolar, sem fins comerciais, com produção interna própria via Agroindústria).

---

## 2. Soluções Analisadas

### 2.1 Fixee

Foodtech brasileira focada em controle de validade e rastreabilidade para *food service*, cobrindo recebimento, produção, armazenamento e descarte de alimentos, com histórico por lote voltado à segurança sanitária.

- **Pontos fortes:** forte controle de validade/lote, foco em rastreabilidade e conformidade sanitária.
- **Limitações frente ao nosso escopo:** não é voltado para produção interna própria (agroindústria de um campus) nem para fluxo de validação por nutricionista responsável, como exige o cliente.

### 2.2 e-cozi

Plataforma SaaS para cozinhas industriais que reúne controle de estoque, fichas técnicas, produção e CMV (custo de mercadoria vendida), incluindo notificações de estoque mínimo e recálculo automático de custo quando o preço de um insumo muda.

- **Pontos fortes:** dashboards de estoque em alerta e lotes vencendo, fichas técnicas ligadas a produção.
- **Limitações frente ao nosso escopo:** modelo comercial pago por assinatura (Basic/Padrão/Premium), pensado para operações com venda ao público — não contempla o fluxo de validação/assinatura de notas por um nutricionista institucional nem o registro específico de produção interna vinda de setores do próprio campus (Agroindústria/Agropecuária).

### 2.3 Saipos

Sistema de gestão para restaurantes com módulo de estoque integrado ao ponto de venda: cada venda dá baixa automática nos insumos usados, a partir de fichas técnicas cadastradas.

- **Pontos fortes:** automação da baixa de estoque a partir de vendas, gestão de fornecedores.
- **Limitações frente ao nosso escopo:** todo o modelo depende de vendas/pedidos (POS), o que não existe no contexto de uma cozinha institucional que serve refeições sem transação comercial associada; não há conceito de "produção interna do próprio campus" nem de nota validada por nutricionista.

---

## 3. Tabela Comparativa

| Funcionalidade | Fixee | e-cozi | Saipos | Sistema proposto (IFPE) |
| :--- | :---: | :---: | :---: | :--- |
| Cadastro de produtos / unidade de medida | ✅ | ✅ | ✅ | ✅ |
| Controle de validade / alertas de vencimento | ✅ *(foco principal)* | ✅ | ❌ *(não é foco)* | ✅ |
| Alerta de estoque mínimo | Parcial | ✅ | ✅ | ✅ |
| Baixa automática por venda/pedido (POS) | ❌ | ❌ | ✅ | ❌ *(não aplicável — sem venda)* |
| Registro de produção interna (setor próprio do campus) | ❌ | ❌ | ❌ | ✅ *(diferencial)* |
| Notas com validação/assinatura de nutricionista | ❌ | ❌ | ❌ | ✅ *(diferencial)* |
| Anexo de foto/documento na movimentação | ❌ | Parcial | ❌ | ✅ |
| Cardápio com projeção de consumo | ❌ | Fichas técnicas *(foco em custo)* | Fichas técnicas *(foco em custo)* | ✅ *(foco em planejamento, não em custo de venda)* |
| Relatório mensal institucional (não comercial) | ❌ | Parcial *(CMV)* | Parcial *(financeiro comercial)* | ✅ |
| Modelo de negócio | SaaS pago | SaaS pago *(R$ 97–397/mês)* | SaaS pago | Sistema próprio, sem custo de licenciamento |

---

## 4. Diferenciais da Solução Proposta

- **Produção interna própria:** nenhuma das soluções comerciais analisadas contempla o recebimento de alimentos vindos de setores produtivos do próprio campus (leite, ovos, queijo, iogurte, carnes, hortaliças) como uma origem distinta e rastreável — é um requisito específico do IFPE.
- **Fluxo de validação por nutricionista:** as soluções comerciais são voltadas a operações comerciais/donos de restaurante; nenhuma delas modela um fluxo de aprovação/assinatura de nota por um profissional responsável, como exigido no contexto institucional.
- **Sem dependência de vendas/POS:** diferente de Saipos e de parte do e-cozi, o sistema não precisa de um módulo de vendas — a "saída" é o consumo direto pela cozinha, não uma transação comercial.
- **Sem custo de licenciamento recorrente:** por ser um sistema próprio desenvolvido pela equipe, não há mensalidade como nas soluções comerciais (Saipos, e-cozi ~R$ 97 a R$ 397/mês).
- **UX voltado à realidade do usuário final (cozinheiras):** ênfase em telas simples e botões grandes para registro rápido de saída, requisito explícito do cliente.

---

## 5. Conclusão

As soluções comerciais analisadas resolvem bem problemas de restaurantes com fins lucrativos (venda ao público, cálculo de CMV, integração com delivery/POS), mas nenhuma atende aos requisitos centrais do cliente do IFPE: rastreabilidade da produção interna do campus e validação formal de notas por um nutricionista responsável. Esses dois pontos são o principal diferencial e o foco de maior valor agregado do sistema proposto.
