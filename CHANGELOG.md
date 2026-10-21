# Changelog

## [0.7.0](https://github.com/ifpebj-ti/gestao-refeitorio/compare/gestao-refeitorio-v0.6.0...gestao-refeitorio-v0.7.0) (2026-10-21)


### Features

* **estoque:** integra envio e exibicao de lote no registro de entrada ([#267](https://github.com/ifpebj-ti/gestao-refeitorio/issues/267)) ([76efe7a](https://github.com/ifpebj-ti/gestao-refeitorio/commit/76efe7ad1e7dc6edd8e17d1c145faf6bb97f0f67))
* **estoque:** integra envio e exibição de lote no registro de entrada ([#267](https://github.com/ifpebj-ti/gestao-refeitorio/issues/267)) ([a85719a](https://github.com/ifpebj-ti/gestao-refeitorio/commit/a85719a5100b975c2cb5f04044e6d2065c056a1f))
* persiste lote nas movimentações de entrada [#247](https://github.com/ifpebj-ti/gestao-refeitorio/issues/247) ([e7d4fa5](https://github.com/ifpebj-ti/gestao-refeitorio/commit/e7d4fa5ed0f62d54617a5f111baaa6d124f40d19))
* persiste lote nas movimentações de entrada [#247](https://github.com/ifpebj-ti/gestao-refeitorio/issues/247) ([d0a237e](https://github.com/ifpebj-ti/gestao-refeitorio/commit/d0a237e533a9d4710ddf63a8ca1f18765668aeed))


### Bug Fixes

* exige JWT_SECRET no profile prod e valida segredo na inicialização [#229](https://github.com/ifpebj-ti/gestao-refeitorio/issues/229) ([ae26286](https://github.com/ifpebj-ti/gestao-refeitorio/commit/ae26286459930fd3c25f0bc517ddfe2518c92b38))
* exige JWT_SECRET no profile prod e valida segredo na inicialização [#229](https://github.com/ifpebj-ti/gestao-refeitorio/issues/229) ([8b8c6a3](https://github.com/ifpebj-ti/gestao-refeitorio/commit/8b8c6a3452e75bb634cef573f6fb18a501707f76))
* valida assinatura binária da foto de movimentação antes de gravar [#230](https://github.com/ifpebj-ti/gestao-refeitorio/issues/230) ([a68116a](https://github.com/ifpebj-ti/gestao-refeitorio/commit/a68116aed85824404d3f4885d923ed158f619f13))
* valida assinatura binária da foto de movimentação antes de gravar [#230](https://github.com/ifpebj-ti/gestao-refeitorio/issues/230) ([cefb967](https://github.com/ifpebj-ti/gestao-refeitorio/commit/cefb967f114bd66a0cecef32cad9e557dccaa3cb))

## [0.6.0](https://github.com/ifpebj-ti/gestao-refeitorio/compare/gestao-refeitorio-v0.5.0...gestao-refeitorio-v0.6.0) (2026-10-21)


### Features

* **consumo:** adiciona reconhecimento e destaque de validade fefo ([#242](https://github.com/ifpebj-ti/gestao-refeitorio/issues/242)) ([6479df2](https://github.com/ifpebj-ti/gestao-refeitorio/commit/6479df28477a4945ecf0a38fb7e5cfc127ef5fc4))
* **consumo:** ocultacao automatica de insumos com estoque zerado ([#243](https://github.com/ifpebj-ti/gestao-refeitorio/issues/243)) ([fcb6c74](https://github.com/ifpebj-ti/gestao-refeitorio/commit/fcb6c747b5a846c6507233aeda3ed9163e57fcc2))
* **consumo:** ocultação automática de insumos com estoque zerado ([#243](https://github.com/ifpebj-ti/gestao-refeitorio/issues/243)) ([0466397](https://github.com/ifpebj-ti/gestao-refeitorio/commit/0466397d37f6a2bf3d0bce2a2319713152343458))
* **consumo:** reconhecimento e priorização de insumos por validade fefo ([#242](https://github.com/ifpebj-ti/gestao-refeitorio/issues/242)) ([205df41](https://github.com/ifpebj-ti/gestao-refeitorio/commit/205df41a2399e3927ccacb4bf8fe9677291f814c))
* **estoque:** adiciona campo com selecao de unidade no registro de entrada ([#241](https://github.com/ifpebj-ti/gestao-refeitorio/issues/241)) ([6a509fd](https://github.com/ifpebj-ti/gestao-refeitorio/commit/6a509fdb76db33935cbef1d92fabbb6b4f298acd))
* **estoque:** adiciona campo com selecao de unidade no registro de entrada ([#241](https://github.com/ifpebj-ti/gestao-refeitorio/issues/241)) ([82592b9](https://github.com/ifpebj-ti/gestao-refeitorio/commit/82592b9142e249bd313e697067229327a7e45b64))
* **estoque:** permite selecionar unidade de medida na entrada inicial do insumo ([#240](https://github.com/ifpebj-ti/gestao-refeitorio/issues/240)) ([fee4751](https://github.com/ifpebj-ti/gestao-refeitorio/commit/fee47514e230558e708c118cd2c21be8e3de88a6))
* **estoque:** permite selecionar unidade de medida na entrada inicial do insumo ([#240](https://github.com/ifpebj-ti/gestao-refeitorio/issues/240)) ([7daa82e](https://github.com/ifpebj-ti/gestao-refeitorio/commit/7daa82ee34e48822a3b0fe668bbfe38c5647aa8c))
* restringe registro de entrada de estoque ao perfil NUTRICIONISTA ([#202](https://github.com/ifpebj-ti/gestao-refeitorio/issues/202)) ([5aaa4bb](https://github.com/ifpebj-ti/gestao-refeitorio/commit/5aaa4bb8d0ecac2a569091b027d62bf06676ebb8))
* restringe registro de entrada de estoque ao perfil NUTRICIONISTA [#202](https://github.com/ifpebj-ti/gestao-refeitorio/issues/202) ([de8b647](https://github.com/ifpebj-ti/gestao-refeitorio/commit/de8b647f9ee6700372395442fff2ca563db4b734))


### Bug Fixes

* **consumo:** remove reatribuicao redundante de textoPrazo ([bd547c2](https://github.com/ifpebj-ti/gestao-refeitorio/commit/bd547c248b677a5eb40bdb12756cd2d687753e62))
* **security:** atualiza follow-redirects e regras do trivyignore ([2ada17d](https://github.com/ifpebj-ti/gestao-refeitorio/commit/2ada17d706a171b5cc9f462c0499b573ecb4c40f))
* **security:** ignora temporariamente CVE-2026-77214 do libexpat no trivy ([ea43041](https://github.com/ifpebj-ti/gestao-refeitorio/commit/ea43041752556da4ac77fbeb60f4830f1b23fb87))

## [0.5.0](https://github.com/ifpebj-ti/gestao-refeitorio/compare/gestao-refeitorio-v0.4.0...gestao-refeitorio-v0.5.0) (2026-10-17)


### Features

* adiciona EmailService com SMTP configurável por variáveis de ambiente [#211](https://github.com/ifpebj-ti/gestao-refeitorio/issues/211) ([36f67e7](https://github.com/ifpebj-ti/gestao-refeitorio/commit/36f67e7a26a4077ce969de79f8045e327620b3ce))
* **consumo:** melhorar ergonomia e responsividade do stepper de quantidade no mobile ([3e09fa2](https://github.com/ifpebj-ti/gestao-refeitorio/commit/3e09fa214ab9fddbd726f9612e4853e68eb3a1f2))
* convite por e-mail no cadastro de usuário e registro do primeiro acesso ([#208](https://github.com/ifpebj-ti/gestao-refeitorio/issues/208)) ([bededf8](https://github.com/ifpebj-ti/gestao-refeitorio/commit/bededf811cc7ff4964927564ed1bfede805a2d94))
* envia alertas de estoque baixo e validade por e-mail ([#203](https://github.com/ifpebj-ti/gestao-refeitorio/issues/203)) ([721d403](https://github.com/ifpebj-ti/gestao-refeitorio/commit/721d4039ac662fcf2a4bc8758259177d57d503de))
* envia alertas de estoque baixo e validade por e-mail para nutricionistas [#203](https://github.com/ifpebj-ti/gestao-refeitorio/issues/203) ([64bf781](https://github.com/ifpebj-ti/gestao-refeitorio/commit/64bf7810c4a4da8ca177c4438e2916cc1eac6c57))
* envia convite por e-mail no cadastro de usuário e permite reenvio [#208](https://github.com/ifpebj-ti/gestao-refeitorio/issues/208) ([b3b3ee2](https://github.com/ifpebj-ti/gestao-refeitorio/commit/b3b3ee25098e128306fb5565721d85ba1aa1b14f))
* **frontend:** modernizar tela de boas-vindas splash ([d372568](https://github.com/ifpebj-ti/gestao-refeitorio/commit/d372568d52d4c52437cd6edad5b98812f62f278e))
* infraestrutura de envio de e-mail com SMTP configurável e Mailpit em dev ([#211](https://github.com/ifpebj-ti/gestao-refeitorio/issues/211)) ([1aedb2d](https://github.com/ifpebj-ti/gestao-refeitorio/commit/1aedb2dc3cf2a9eab3b95e2acc33dff2be628ca0))
* registra primeiro acesso do usuário no login com Google [#208](https://github.com/ifpebj-ti/gestao-refeitorio/issues/208) ([07b4600](https://github.com/ifpebj-ti/gestao-refeitorio/commit/07b4600dcd6f1c605814608e3094af203e4920ad))


### Bug Fixes

* **auth:** adiciona fallbacks de oauth e cors para ambiente de producao ([3d288a2](https://github.com/ifpebj-ti/gestao-refeitorio/commit/3d288a27e30abadc54afb773a6cd70ac962df1f0))
* **auth:** adiciona fallbacks de oauth e cors para producao duckdns ([8215291](https://github.com/ifpebj-ti/gestao-refeitorio/commit/821529188ceea9e229be7fa5f5a17d354aa486f5))
* **security:** exigir autenticacao em produtos e desabilitar swagger em prod ([#222](https://github.com/ifpebj-ti/gestao-refeitorio/issues/222)) ([30d8536](https://github.com/ifpebj-ti/gestao-refeitorio/commit/30d8536a9d67582d79c26f1361221dd22856a3ed))
* **security:** exigir autenticacao em produtos e desabilitar swagger em prod ([#222](https://github.com/ifpebj-ti/gestao-refeitorio/issues/222)) ([cd55732](https://github.com/ifpebj-ti/gestao-refeitorio/commit/cd5573214bcac411d89260671cdd9f274f9db606))

## [0.4.0](https://github.com/ifpebj-ti/gestao-refeitorio/compare/gestao-refeitorio-v0.3.0...gestao-refeitorio-v0.4.0) (2026-10-14)


### Features

* adiciona alerta de estoque baixo [#148](https://github.com/ifpebj-ti/gestao-refeitorio/issues/148) ([f82b48d](https://github.com/ifpebj-ti/gestao-refeitorio/commit/f82b48d0341209dca9ba49ef5ddf5f37bd86477c))
* adiciona cadastro de cardapio com projecao de consumo [#154](https://github.com/ifpebj-ti/gestao-refeitorio/issues/154) ([bcef567](https://github.com/ifpebj-ti/gestao-refeitorio/commit/bcef5675b7f6bf9a61ade6cb6ab15e4765bdea6b))
* adiciona cadastro de data de validade na entrada [#145](https://github.com/ifpebj-ti/gestao-refeitorio/issues/145) ([ff58fff](https://github.com/ifpebj-ti/gestao-refeitorio/commit/ff58fff663a5db1f6848d77fb2f6a7b954c7b232))
* adiciona exportacao do relatorio mensal em pdf e excel [#163](https://github.com/ifpebj-ti/gestao-refeitorio/issues/163) ([7733dea](https://github.com/ifpebj-ti/gestao-refeitorio/commit/7733dea71fe0ccf9961aedc1b80d8648ae973035))
* adiciona favicon ([58fcc10](https://github.com/ifpebj-ti/gestao-refeitorio/commit/58fcc100bf348f7f0929ba2a7bdc946bb0ea6875))
* adiciona grafico de consumo por periodo [#166](https://github.com/ifpebj-ti/gestao-refeitorio/issues/166) ([5c49ab4](https://github.com/ifpebj-ti/gestao-refeitorio/commit/5c49ab453c9291edf2007339dcaaba4db31b2172))
* adiciona prioridade de alerta de validade para produtos frios [#151](https://github.com/ifpebj-ti/gestao-refeitorio/issues/151) ([36d2bad](https://github.com/ifpebj-ti/gestao-refeitorio/commit/36d2bad02a3ad74f7cbf17c64f9499da9d44069f))
* adiciona projecao de consumo de insumos por periodo [#157](https://github.com/ifpebj-ti/gestao-refeitorio/issues/157) ([61018fd](https://github.com/ifpebj-ti/gestao-refeitorio/commit/61018fd76bfc9e7b8dee44e72617f44ed73affdb))
* adiciona relatorio mensal consolidado de estoque [#160](https://github.com/ifpebj-ti/gestao-refeitorio/issues/160) ([e23a93b](https://github.com/ifpebj-ti/gestao-refeitorio/commit/e23a93bad61a9f3ba1735ad9027969cb7d8104fa))
* ajustes gerais de cardapio, consumo diario, central de alertas e migration de produtos ([8674d93](https://github.com/ifpebj-ti/gestao-refeitorio/commit/8674d93e78ad13b6316791e6a8e49c976d489313))
* **auditoria:** persiste fornecedor real no banco e conecta no modal e cadastro de insumo ([dedb0f3](https://github.com/ifpebj-ti/gestao-refeitorio/commit/dedb0f3d3101bcd49fa5d739bf067c6c3d35df1d))
* **auth:** unifica tela de login com Google, adiciona controle de ro… ([955f4c6](https://github.com/ifpebj-ti/gestao-refeitorio/commit/955f4c6cc8997fcdd3dab0594e2ee2b91b7b8aec))
* **auth:** unifica tela de login com Google, adiciona controle de rotas e restaura perfil cozinha ([871526c](https://github.com/ifpebj-ti/gestao-refeitorio/commit/871526c62076c277ce99063d0ce6a855129f1e3c))
* **cardapio:** exibição automática na tv da cozinha e simplificação do consumo diário ([53fd7dc](https://github.com/ifpebj-ti/gestao-refeitorio/commit/53fd7dc762dc7f2bf77b7da2774e06c6a1d95293))
* **cozinha:** remove acesso a tela de recebimento de mercadorias (US13) ([b84b3ac](https://github.com/ifpebj-ti/gestao-refeitorio/commit/b84b3acadd59069d5395814e0c4c1045b48bb661))
* **cozinha:** remove acesso a tela de recebimento de mercadorias (US13) ([7c1ba8a](https://github.com/ifpebj-ti/gestao-refeitorio/commit/7c1ba8a9013eb6b2df53454a6c1024da4adad84a))
* **estoque:** auditoria com dados reais, gestão de insumos e padronização visual ([cdf0064](https://github.com/ifpebj-ti/gestao-refeitorio/commit/cdf00647d21d80c537a677caeda04bcd8f407159))
* **estoque:** integra extrato de auditoria com backend e adiciona cadastro/edicao de insumos ([8fd017f](https://github.com/ifpebj-ti/gestao-refeitorio/commit/8fd017f50bfd8ad46fc315e472f3ec72f639f525))
* **estoque:** padronizacao visual, canal agropecuaria e integracao de auditoria (closes [#173](https://github.com/ifpebj-ti/gestao-refeitorio/issues/173), closes [#174](https://github.com/ifpebj-ti/gestao-refeitorio/issues/174)) ([cc4ede0](https://github.com/ifpebj-ti/gestao-refeitorio/commit/cc4ede0ba8cbb5b05d90c05cd037346dc36c8564))
* exibicao automatica do cardapio na tv da cozinha e simplificacao do consumo diario ([333b372](https://github.com/ifpebj-ti/gestao-refeitorio/commit/333b372ceccd595cb83d8791a0617f9cda98bebe))
* **frontend:** melhorias no consumo diario, navegacao, rotas e ident… ([e10ab9f](https://github.com/ifpebj-ti/gestao-refeitorio/commit/e10ab9f7cf1693ac7af860539c3fc6310b333c63))
* **frontend:** melhorias no consumo diario, navegacao, rotas e identidade visual ([f014962](https://github.com/ifpebj-ti/gestao-refeitorio/commit/f014962f5d2dac6dbe867bc3ec6e081a286b70be))
* implementa integracao cardapio com consumo diario e mural para … ([ee75225](https://github.com/ifpebj-ti/gestao-refeitorio/commit/ee75225697425edf908871cbc9957b8c58ecc3e2))
* implementa integracao cardapio com consumo diario e mural para TV (closes [#188](https://github.com/ifpebj-ti/gestao-refeitorio/issues/188), closes [#189](https://github.com/ifpebj-ti/gestao-refeitorio/issues/189)) ([568d273](https://github.com/ifpebj-ti/gestao-refeitorio/commit/568d273410521da20480d8f58a0a29aea4ec03a3))
* melhorias no consumo diário, cardápio, estoque e transmissão de tv ([0bb5f1e](https://github.com/ifpebj-ti/gestao-refeitorio/commit/0bb5f1ea58833cd496d705a25e8d7dc2a9bee030))
* persistencia de sessao diferenciada por perfil e expiracao segu… ([b319cf1](https://github.com/ifpebj-ti/gestao-refeitorio/commit/b319cf1e754067736d45adb6634e66817f93ae0a))
* persistencia de sessao diferenciada por perfil e expiracao segura de jwt ([5a99383](https://github.com/ifpebj-ti/gestao-refeitorio/commit/5a99383e73c3490a78c485ff53f41af2a7c97a4f))
* **produtos:** adiciona endpoint e campo no modal para edicao do valor de referencia ([76b90ad](https://github.com/ifpebj-ti/gestao-refeitorio/commit/76b90ad838be9f2c59f2ebb1c87bbe032c9eb2be))
* **produtos:** ordena produtos em ordem alfabetica nas listagens do backend e frontend ([0ead9af](https://github.com/ifpebj-ti/gestao-refeitorio/commit/0ead9af35b4f156949f86aa6523d4d214f0c5a53))
* **relatorios:** implementa painel de relatorios e graficos integrado ao backend [#59](https://github.com/ifpebj-ti/gestao-refeitorio/issues/59) ([bfceffe](https://github.com/ifpebj-ti/gestao-refeitorio/commit/bfceffe4c0d30a70cdd1d6100e76dc8fca6b6c6c))
* **tv:** sincronizacao central do cardapio via api e protecao da rot… ([1012117](https://github.com/ifpebj-ti/gestao-refeitorio/commit/10121173a07a49462c6da2dc569b2e421d8fbad6))
* **tv:** sincronizacao central do cardapio via api e protecao da rota tv contra logout ([de89fb1](https://github.com/ifpebj-ti/gestao-refeitorio/commit/de89fb16c02f97801a8bd087a01811236b111d4f))
* **usuarios:** implementa gestao e cadastro de usuarios para admin e isola perfis ([1b1b837](https://github.com/ifpebj-ti/gestao-refeitorio/commit/1b1b8377d38ac5d66c1c6f00e700dfa764d541ee))
* **usuarios:** implementa gestao e cadastro de usuarios para admin e… ([3234624](https://github.com/ifpebj-ti/gestao-refeitorio/commit/32346248f8f4207253e1ff75d7c566f0677e682f))


### Bug Fixes

* **auth:** resolve fluxo oauth na oci e adiciona seed de usuarios ([#204](https://github.com/ifpebj-ti/gestao-refeitorio/issues/204)) ([d4b0a56](https://github.com/ifpebj-ti/gestao-refeitorio/commit/d4b0a56466e7e116fc8028430b13b88230d694a9))
* **auth:** resolve fluxo oauth na oci e adiciona seed de usuarios ([#204](https://github.com/ifpebj-ti/gestao-refeitorio/issues/204)) ([1772974](https://github.com/ifpebj-ti/gestao-refeitorio/commit/177297416f337fca2c5c1e9566f1d9072f26ff75))
* **backend,frontend:** retrocompatibilidade dos testes de movimentacao/produtos e campos preselecionados ([9fa3528](https://github.com/ifpebj-ti/gestao-refeitorio/commit/9fa3528f7426e5ffa385cec9885b0fb16747c1f7))
* **backend:** atualiza jackson para corrigir CVEs apontadas pelo trivy ([7138c23](https://github.com/ifpebj-ti/gestao-refeitorio/commit/7138c23c15862ed936334cdf75388e6d9eeff897))
* **backend:** remove verificacao redundante de nulidade para resolver code-quality ([85e7cb0](https://github.com/ifpebj-ti/gestao-refeitorio/commit/85e7cb02a865ed376f39311daf25345a8cbe0e9e))
* **ci:** adiciona import faltante no ProdutoService e ajusta tipagem de origem no frontend ([82ef860](https://github.com/ifpebj-ti/gestao-refeitorio/commit/82ef860a3cb8078b4c10d669f74759902c530b67))
* **ci:** ajusta mock de ItemCardapioRepository nos testes e elimina RegExp nao-literal para Semgrep ([2d8a7d8](https://github.com/ifpebj-ti/gestao-refeitorio/commit/2d8a7d8aecdadc2ec307728c9568ddd56520d511))
* **ci:** align backend image with Java 21 ([c80f07e](https://github.com/ifpebj-ti/gestao-refeitorio/commit/c80f07e0682937e0a73a2ab2f738f348e8354663))
* **ci:** isolate repository scan from Maven rate limits ([ae2e733](https://github.com/ifpebj-ti/gestao-refeitorio/commit/ae2e7336f2e39c08e2ec1623926a5f8517889d57))
* **ci:** restore compatible frontend dependency lock ([0e429d1](https://github.com/ifpebj-ti/gestao-refeitorio/commit/0e429d171c69cfc5a023dfb307d6ce76d0eaabf8))
* **ci:** support current frontend lint dependencies ([b24bf8f](https://github.com/ifpebj-ti/gestao-refeitorio/commit/b24bf8f88ea8b8b9d9225554a92bb42a28a140a7))
* **code-quality:** resolve apontamentos do bot de code-quality (condicional redundante e variaveis nao utilizadas) ([08e6c57](https://github.com/ifpebj-ti/gestao-refeitorio/commit/08e6c57a28de0de807e5ec92e2f66833e2e47509))
* **consumo:** remove dados mockados de consumo e corrige mismatch de … ([c384865](https://github.com/ifpebj-ti/gestao-refeitorio/commit/c3848659444aa36ee113f1f137f14eeb9b47953d))
* **consumo:** remove dados mockados de consumo e corrige mismatch de hidratacao ([92d4a95](https://github.com/ifpebj-ti/gestao-refeitorio/commit/92d4a95e338dfbfd31078abd505aea23bd92d176))
* corrige UUIDs fixos dos locais de armazenamento na migration V4 ([741b026](https://github.com/ifpebj-ti/gestao-refeitorio/commit/741b026718571afa1f4ff6196d725674ac1f9134))
* **deploy:** bound SSH connection attempts ([9b50b18](https://github.com/ifpebj-ti/gestao-refeitorio/commit/9b50b18a59a57bc17da32f83c986da7c92b64074))
* **frontend:** reimporta icone X para fechamento de erros em consumo ([6125222](https://github.com/ifpebj-ti/gestao-refeitorio/commit/61252222908a5095698f16051cc0f7883647668d))
* **lint:** corrige prefer-const e limpa imports nao utilizados ([1f09dd3](https://github.com/ifpebj-ti/gestao-refeitorio/commit/1f09dd3df8618ea283ee1ea29be6aef7f6319588))
* mapeia parametro de query ausente para 400 em vez de 500 [#158](https://github.com/ifpebj-ti/gestao-refeitorio/issues/158) ([f396848](https://github.com/ifpebj-ti/gestao-refeitorio/commit/f396848bc644f9871d23b0f0e269b6ae7cf0b6d8))
* **relatorios:** ajusta painel de relatorios ([156428f](https://github.com/ifpebj-ti/gestao-refeitorio/commit/156428f1162593ed08c78685b0ed287380c17082))
* **security:** atualiza next para 16.3.8 e ignora CVE-2026-94483 no trivy ([0b9d254](https://github.com/ifpebj-ti/gestao-refeitorio/commit/0b9d2543be8ce1fdb8a5662db8582aaabd970830))
* **security:** avoid persisting checkout credentials ([2922807](https://github.com/ifpebj-ti/gestao-refeitorio/commit/29228078684d87a55ab0fa6fd44bd63e96bf0319))
* **security:** exclude git metadata from repository scan ([30f5bc1](https://github.com/ifpebj-ti/gestao-refeitorio/commit/30f5bc1a54acf21b7bcfe91b06d52884636a49ac))
* **security:** ignora temporariamente CVE-2026-93749 do source-map-js no trivy ([1dbaaf5](https://github.com/ifpebj-ti/gestao-refeitorio/commit/1dbaaf5bff0705251d3488c162843b287cd664e8))
* **security:** pin actions and harden dependabot ([bbaf12e](https://github.com/ifpebj-ti/gestao-refeitorio/commit/bbaf12e33d277304a81a13ea5162b9381d63a6b2))
* **security:** scan resolved container dependencies ([fd05b0e](https://github.com/ifpebj-ti/gestao-refeitorio/commit/fd05b0e93bd79375ff50c06e7ddb90a5f750cfc5))
* **security:** scope temporary base image exceptions ([625607a](https://github.com/ifpebj-ti/gestao-refeitorio/commit/625607a4f1c525c1126683fff42e8479818c2396))
* **security:** update vulnerable Jackson BOMs ([9784083](https://github.com/ifpebj-ti/gestao-refeitorio/commit/97840836f64662b8e1fb8c13d970989aff41551d))
* torna origem do CORS configurável por APP_URL_FRONTEND [#209](https://github.com/ifpebj-ti/gestao-refeitorio/issues/209) ([b8881d6](https://github.com/ifpebj-ti/gestao-refeitorio/commit/b8881d672df6f72f8e64fb0f5b3ef6598d4043b4))
* torna origem do CORS configurável por variável de ambiente ([#209](https://github.com/ifpebj-ti/gestao-refeitorio/issues/209)) ([a0f319a](https://github.com/ifpebj-ti/gestao-refeitorio/commit/a0f319a42c1b7e8bdaeebd7d8fa5d8aa710ae2ce))

## [0.3.0](https://github.com/ifpebj-ti/gestao-refeitorio/compare/gestao-refeitorio-v0.2.0...gestao-refeitorio-v0.3.0) (2026-09-24)


### Features

* **cardapio:** implementa interface de visualizacao e gestao de cardapio semanal ([c834741](https://github.com/ifpebj-ti/gestao-refeitorio/commit/c834741b2f2f455525e40dd3030fc96219dba081))
* **cardapio:** interface de visualização e gestão de cardápio semanal ([#58](https://github.com/ifpebj-ti/gestao-refeitorio/issues/58)) ([086cd19](https://github.com/ifpebj-ti/gestao-refeitorio/commit/086cd1959ff76b5bcb00d5fb7c1dddee531401ac))
* **cozinha:** implementa tela de recebimento e conferência de insumos ([6a21581](https://github.com/ifpebj-ti/gestao-refeitorio/commit/6a21581b1e621bd0fc049dbb0a05a181c6b8ebb9))
* **cozinha:** tela de registro de consumo diário e validação de saldo ([#55](https://github.com/ifpebj-ti/gestao-refeitorio/issues/55)) ([3b7b3e9](https://github.com/ifpebj-ti/gestao-refeitorio/commit/3b7b3e9c8bd4b44337896446e5d0248a180d37e0))
* **estoque:** central de alertas de estoque baixo e controle de validade ([#57](https://github.com/ifpebj-ti/gestao-refeitorio/issues/57)) ([a4ef314](https://github.com/ifpebj-ti/gestao-refeitorio/commit/a4ef3145ddb97249f443340773cc1c0396bf9b11))
* implementa splash screen de seleção de perfil e corrige layout condicional ([50e716d](https://github.com/ifpebj-ti/gestao-refeitorio/commit/50e716ddaa088f3a6787678b7f11b9dd31c8e7d9))
* melhorar responsividade mobile com cards e realizar limpeza de codigo ([cba868f](https://github.com/ifpebj-ti/gestao-refeitorio/commit/cba868f335bc773fc0429de979f075f46c0d2cf8))


### Bug Fixes

* ajustes de responsividade mobile com cards e limpeza geral de código ([1edaf4b](https://github.com/ifpebj-ti/gestao-refeitorio/commit/1edaf4b8db6a865621a6f8ae53ba2f8468277f7e))

## [0.2.0](https://github.com/ifpebj-ti/gestao-refeitorio/compare/gestao-refeitorio-v0.1.0...gestao-refeitorio-v0.2.0) (2026-09-22)


### Features

* adiciona anexar e consultar foto de movimentacao via multipart [#88](https://github.com/ifpebj-ti/gestao-refeitorio/issues/88) ([d8f6bd3](https://github.com/ifpebj-ti/gestao-refeitorio/commit/d8f6bd3d2ec3a90b38d387f6d65b720b88641173))
* adiciona cadastro de produto com DTO, validacao e interface de service [#74](https://github.com/ifpebj-ti/gestao-refeitorio/issues/74) ([14cd28a](https://github.com/ifpebj-ti/gestao-refeitorio/commit/14cd28a855cc6a529213b557807ed1d7b95bec04))
* adiciona consulta de saldo total e por local do produto [#94](https://github.com/ifpebj-ti/gestao-refeitorio/issues/94) ([3da4ef8](https://github.com/ifpebj-ti/gestao-refeitorio/commit/3da4ef8bf47ed3c44f11ebbbf7b577f71e999dbe))
* adiciona edicao de unidade de medida via DTO com rastreabilidade em log [#77](https://github.com/ifpebj-ti/gestao-refeitorio/issues/77) ([aae683b](https://github.com/ifpebj-ti/gestao-refeitorio/commit/aae683bb894058aa8ecbcfdb09f8d6ba6670b8f6))
* adiciona filtro por categoria na listagem de produtos [#80](https://github.com/ifpebj-ti/gestao-refeitorio/issues/80) ([9964d0e](https://github.com/ifpebj-ti/gestao-refeitorio/commit/9964d0e3ff47f621296638ffa7a83a0b86c27ca2))
* adiciona historico de movimentacoes do produto [#97](https://github.com/ifpebj-ti/gestao-refeitorio/issues/97) ([dd96418](https://github.com/ifpebj-ti/gestao-refeitorio/commit/dd96418b850783c44cc23dc0b6213ab49bb76db1))
* adiciona registro de entrada de produto via POST /api/movimentacoes/entrada [#84](https://github.com/ifpebj-ti/gestao-refeitorio/issues/84) ([a6d836c](https://github.com/ifpebj-ti/gestao-refeitorio/commit/a6d836c960173b5fdf256b626f12cf4e91521f74))
* adiciona registro de saida de produto com tipoSaida [#91](https://github.com/ifpebj-ti/gestao-refeitorio/issues/91) ([c8b953d](https://github.com/ifpebj-ti/gestao-refeitorio/commit/c8b953dc2a88a6671adc8e0cd5367e6d969c29e0))
* adiciona testes automatizados da edicao de unidade de medida [#78](https://github.com/ifpebj-ti/gestao-refeitorio/issues/78) ([60363eb](https://github.com/ifpebj-ti/gestao-refeitorio/commit/60363eb1b1d5d560e98743a4d8f55847c3391583))
* adiciona testes automatizados de anexar e consultar foto de movimentacao [#89](https://github.com/ifpebj-ti/gestao-refeitorio/issues/89) ([ff3a615](https://github.com/ifpebj-ti/gestao-refeitorio/commit/ff3a615b1b2b9b7ffe364259d2eac868ff1fc326))
* adiciona testes automatizados do cadastro de produto [#75](https://github.com/ifpebj-ti/gestao-refeitorio/issues/75) ([afb0631](https://github.com/ifpebj-ti/gestao-refeitorio/commit/afb0631534092d456041e448bbf10b438289e317))
* adiciona testes automatizados do filtro de produtos por categoria [#81](https://github.com/ifpebj-ti/gestao-refeitorio/issues/81) ([e27f531](https://github.com/ifpebj-ti/gestao-refeitorio/commit/e27f531121b4579493ddd7caaa0e2cd4ea528059))
* adiciona testes automatizados do LocalArmazenamentoRepository [#85](https://github.com/ifpebj-ti/gestao-refeitorio/issues/85) ([d3c8f8a](https://github.com/ifpebj-ti/gestao-refeitorio/commit/d3c8f8a03adc9c2e1c54da884611091efc48b6b4))
* adiciona testes automatizados do registro de entrada de produto [#86](https://github.com/ifpebj-ti/gestao-refeitorio/issues/86) ([6d02ea1](https://github.com/ifpebj-ti/gestao-refeitorio/commit/6d02ea12b02d49f596b14d92adc351c0047a72e1))
* adiciona testes automatizados do registro de saida de produto [#92](https://github.com/ifpebj-ti/gestao-refeitorio/issues/92) ([b9c0843](https://github.com/ifpebj-ti/gestao-refeitorio/commit/b9c0843bc54884ebd238c3eca39ebb57b445c2d7))
* adicionar cadastro, edicao e desativacao de usuarios pelo admin [#71](https://github.com/ifpebj-ti/gestao-refeitorio/issues/71) ([2418e0b](https://github.com/ifpebj-ti/gestao-refeitorio/commit/2418e0b442b5402abad203bf7c367618c29db745))
* **auth:** integra autenticacao via google oauth2 e jwt (closes [#11](https://github.com/ifpebj-ti/gestao-refeitorio/issues/11), closes [#53](https://github.com/ifpebj-ti/gestao-refeitorio/issues/53)) ([b497b57](https://github.com/ifpebj-ti/gestao-refeitorio/commit/b497b57d442d0618039ee7f81b1f13e6c18a4af1))
* **auth:** integração completa de autenticação com Google OAuth2 e JWT (US01) ([0c0f923](https://github.com/ifpebj-ti/gestao-refeitorio/commit/0c0f923823e0bf510466c9236313b69868be7334))
* endpoint GET /api/auth/me para o frontend restaurar o perfil autenticado refs [#68](https://github.com/ifpebj-ti/gestao-refeitorio/issues/68) ([75df4a2](https://github.com/ifpebj-ti/gestao-refeitorio/commit/75df4a22266e3b829ad4a79eaef37c24d07b335e))
* endpoint POST /api/auth/google para login via Google OAuth2 [#62](https://github.com/ifpebj-ti/gestao-refeitorio/issues/62) ([d8b0617](https://github.com/ifpebj-ti/gestao-refeitorio/commit/d8b0617ce23ef9db8b4443d60e483e3ee6bc1040))
* **estoque:** finaliza tela de inventario e integra historico de auditoria com backend ([409d10c](https://github.com/ifpebj-ti/gestao-refeitorio/commit/409d10c286ca883ff2f8a714564e5cceae812176))
* **estoque:** integra inventario e historico de auditoria com o backend ([#54](https://github.com/ifpebj-ti/gestao-refeitorio/issues/54)) ([1c69af9](https://github.com/ifpebj-ti/gestao-refeitorio/commit/1c69af9554995000909783e03ae6e7eb42a6e515))
* exceções de autenticação e tratamento no GlobalExceptionHandler [#62](https://github.com/ifpebj-ti/gestao-refeitorio/issues/62) ([34f54bf](https://github.com/ifpebj-ti/gestao-refeitorio/commit/34f54bfc80cc52e3835ce530ae1de1a687db9228))
* move foto de Movimentacao para tabela separada MovimentacaoFoto [#88](https://github.com/ifpebj-ti/gestao-refeitorio/issues/88) ([66ce602](https://github.com/ifpebj-ti/gestao-refeitorio/commit/66ce602d3ecd07fb650154c5177e0ab81f5b2eff))
* move origem de Produto para Movimentacao e adiciona local/valor [#84](https://github.com/ifpebj-ti/gestao-refeitorio/issues/84) ([8cafcde](https://github.com/ifpebj-ti/gestao-refeitorio/commit/8cafcde01af709b5e91fe083b14ff5b7590ecf1b))
* **produtos:** integra catalogo de inventario com api e adiciona seed flyway de 58 itens ([#54](https://github.com/ifpebj-ti/gestao-refeitorio/issues/54)) ([586fa3c](https://github.com/ifpebj-ti/gestao-refeitorio/commit/586fa3cbb4359167f2e0d586fb171273d03b1b81))
* RBAC de perfis (E1) ([a299b93](https://github.com/ifpebj-ti/gestao-refeitorio/commit/a299b93597e756a0bb461d43d043b33f55526d7b))
* tratar AccessDeniedException do PreAuthorize como 403 com log de auditoria refs [#68](https://github.com/ifpebj-ti/gestao-refeitorio/issues/68) ([fdc6778](https://github.com/ifpebj-ti/gestao-refeitorio/commit/fdc6778d6d462f77f7bcfee4bd0ac8a0bf0907aa))
* validador do id_token do Google (GoogleIdTokenVerifier) [#62](https://github.com/ifpebj-ti/gestao-refeitorio/issues/62) ([4384cb3](https://github.com/ifpebj-ti/gestao-refeitorio/commit/4384cb390c34a1843f27f145501e3008bfc14bbf))


### Bug Fixes

* adapta backend e frontend para Spring Boot 4 e React 19 ([66c09a7](https://github.com/ifpebj-ti/gestao-refeitorio/commit/66c09a7641548588ca8101bc55a5e6c405df1962))
* adiciona AuthenticationEntryPoint para retornar 401 em requisicao nao autenticada [#68](https://github.com/ifpebj-ti/gestao-refeitorio/issues/68) ([cbfdf88](https://github.com/ifpebj-ti/gestao-refeitorio/commit/cbfdf880e3aeddb72262c4adf13c0ef528ba9958))
* ajusta asercao desatualizada de POST /api/produtos para 201 [#75](https://github.com/ifpebj-ti/gestao-refeitorio/issues/75) ([0ffe7eb](https://github.com/ifpebj-ti/gestao-refeitorio/commit/0ffe7ebe0a6d03fa8aa92b88fd418618a8c8b032))
* ajusta coluna origem de produtos para opcional [#74](https://github.com/ifpebj-ti/gestao-refeitorio/issues/74) ([992f9d0](https://github.com/ifpebj-ti/gestao-refeitorio/commit/992f9d0f8077859594223e23fa3cc8bb37e9f2b9))
* ajusta declaração de service antes dos serviços em si ([7dd742e](https://github.com/ifpebj-ti/gestao-refeitorio/commit/7dd742ebd7e17db643cfdffb6e529c5801c4276f))
* **ci:** align backend image with Java 21 ([33be4ea](https://github.com/ifpebj-ti/gestao-refeitorio/commit/33be4eabc339b2ff700717ce49dfae5fb1da02b9))
* **ci:** restore migrations and remove duplicate CodeQL ([6d5f3ce](https://github.com/ifpebj-ti/gestao-refeitorio/commit/6d5f3cec90170966d1b30411452beb76e52d88eb))
* **ci:** unblock develop deployment pipeline ([13c90e4](https://github.com/ifpebj-ti/gestao-refeitorio/commit/13c90e464236b2a64aeedba53baafb94036c4616))
* **ci:** unblock develop deployment pipeline ([dad4b8e](https://github.com/ifpebj-ti/gestao-refeitorio/commit/dad4b8e1573ecf22fac854a977e8e122b44e65e8))
* corrige pacote AutoConfigureTestDatabase e adiciona starter jdbc-test ([13d1b5d](https://github.com/ifpebj-ti/gestao-refeitorio/commit/13d1b5d46c31b567ee1a3e82b78e372f7ac17fd2))
* **docker:** corrige usuarios nao-root nos dockerfiles e versoes de teste no pom ([e28d9b6](https://github.com/ifpebj-ti/gestao-refeitorio/commit/e28d9b66c4c26ada6ba27aa11ff470323577a6a4))
* **estoque:** resolve falha silenciosa no registro de entradas e corrige chamadas da API ([ef126ad](https://github.com/ifpebj-ti/gestao-refeitorio/commit/ef126adb7b434a33a62ec86db62976bd0fa6f29e))
* **frontend:** consolida alteracoes da tela de inventario ([f3d33e1](https://github.com/ifpebj-ti/gestao-refeitorio/commit/f3d33e1386909972d28b1c8863ebc884f7cc84e4))
* **frontend:** regenera package-lock limpo e alinha dependencias ([7b3ea0c](https://github.com/ifpebj-ti/gestao-refeitorio/commit/7b3ea0c326c074c67f4c6dee3a0d440f3de8fb8f))
* JwtAuthFilter não autentica usuário desativado [#62](https://github.com/ifpebj-ti/gestao-refeitorio/issues/62) ([6444f2b](https://github.com/ifpebj-ti/gestao-refeitorio/commit/6444f2b14fc1b908f530f97c2320cf6eba3aa1eb))
* regenera package-lock.json sincronizado com package.json ([ba65dcb](https://github.com/ifpebj-ti/gestao-refeitorio/commit/ba65dcbeacf362dcd7c199d77c0fbd55a149fe6d))
* remove caractere '&gt;' indevido ([5bfd2d9](https://github.com/ifpebj-ti/gestao-refeitorio/commit/5bfd2d933f4394bba76bd9e73be57d72a5587afd))
* remove caractere '&gt;' indevido ([16eb5c3](https://github.com/ifpebj-ti/gestao-refeitorio/commit/16eb5c30a17235e69665ff0f7e1d7f8b739b8151))
* restringe permitAll a /api/auth/google, nao a todo /api/auth/** refs [#68](https://github.com/ifpebj-ti/gestao-refeitorio/issues/68) ([ae217bb](https://github.com/ifpebj-ti/gestao-refeitorio/commit/ae217bbccf7aa1724710bea6e32e41c141685a43))
