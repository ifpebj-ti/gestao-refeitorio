# Observabilidade com OpenTelemetry e LGTM

O backend pode enviar **traces** para o Tempo, **métricas** para o Mimir e **logs** para o Loki do
LGTM que roda na VM da OCI (compose separado, rede Docker `lgtm_default`) (#314). Quem faz isso é o
[agente Java do OpenTelemetry](https://github.com/open-telemetry/opentelemetry-java-instrumentation),
que vem dentro da imagem do backend e instrumenta sozinho o Spring MVC, o JDBC/Hibernate, a JVM e o
Logback. Nenhuma classe Java foi alterada: os logs SLF4J que já existem (login negado, 403, saldo
bloqueado etc.) chegam ao Loki com o `trace_id` da requisição.

## Desligado por padrão

O jar fica em `/app/opentelemetry-javaagent.jar`, mas a JVM só o carrega quando a variável
`JAVA_TOOL_OPTIONS` manda. Sem ela, a imagem roda exatamente como antes, em qualquer ambiente.

## Como ligar no servidor

1. Confirme que a rede do LGTM existe: `docker network inspect lgtm_default`.
2. Acrescente ao `/opt/gestao-refeitorio/.env`:
   ```
   JAVA_TOOL_OPTIONS=-javaagent:/app/opentelemetry-javaagent.jar
   OTEL_SERVICE_NAME=gestao-refeitorio
   OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
   OTEL_TRACES_EXPORTER=otlp
   OTEL_METRICS_EXPORTER=otlp
   OTEL_LOGS_EXPORTER=otlp
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://lgtm-tempo-1:4318/v1/traces
   OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://lgtm-mimir-1:9009/otlp/v1/metrics
   OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://lgtm-loki-1:3100/otlp/v1/logs
   ```
   Os endereços usam o nome dos containers do LGTM: dentro do container do backend, `localhost` é o
   próprio backend. As variáveis chegam ao container pelo `env_file`; não repasse no `environment`
   do compose.
3. Rode o próximo deploy, ou recrie só o backend:
   ```bash
   cd /opt/gestao-refeitorio
   docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.observabilidade.yml up -d backend
   ```
4. Confira no log do backend a linha `opentelemetry-javaagent - version: ...` e, no Grafana, o serviço
   `gestao-refeitorio` no Tempo, no Loki e no Mimir.

Para **desligar**, remova `JAVA_TOOL_OPTIONS` do `.env` e recrie o backend.

## Rede compartilhada

O `docker-compose.observabilidade.yml` coloca o backend também na rede externa `lgtm_default`. O
`scripts/deploy-remote.sh` só aplica esse overlay quando a rede existe; sem ela, o deploy segue normal,
sem observabilidade e sem rollback (o mesmo vale para o rollback do próprio script).

Se a rede for criada **depois** de um deploy, o backend só entra nela no deploy seguinte. Para
conectar na hora:

```bash
docker network connect lgtm_default gestao-refeitorio-backend-1
```

## Segurança e operação

- **Dados pessoais:** os logs têm e-mails de usuários (login, convite, cadastro), que passam a ficar
  no Loki. O Grafana precisa ter acesso restrito e retenção definida. Token, `id_token` e senha nunca
  são registrados.
- **Rede:** as portas do LGTM (4318, 9009, 3100) ficam só na rede Docker interna. O envio é HTTP sem
  TLS e sem autenticação; não exponha essas portas para fora da VM.
- **O que o agente captura:** URL, método e status das requisições e as queries SQL sanitizadas (sem
  valores). Por padrão, não captura cabeçalhos (como `Authorization`) nem o corpo das requisições.
- **LGTM fora do ar:** a aplicação continua atendendo normalmente; o agente só tenta reenviar e
  registra avisos no log.
- **Memória:** o backend tem limite de 512M em produção e o agente acrescenta algumas dezenas de MB.
  Acompanhe com `docker stats` depois de ligar e, se for preciso, aumente o limite no
  `docker-compose.prod.yml`.

## Atualizar a versão do agente

O Dependabot não acompanha o jar baixado por URL. Para atualizar:

1. Pegue a versão e o digest da release:
   ```bash
   gh api repos/open-telemetry/opentelemetry-java-instrumentation/releases/latest \
     --jq '.tag_name, (.assets[] | select(.name=="opentelemetry-javaagent.jar") | .digest)'
   ```
2. Troque `OTEL_AGENT_VERSION` e `OTEL_AGENT_SHA256` no `backend/Dockerfile`. O build falha se o
   checksum não bater.
3. Se o Trivy apontar CVE crítica dentro do agente, essa atualização costuma ser a correção.
