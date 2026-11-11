FROM maven:3.9-eclipse-temurin-26-alpine@sha256:4c85d516dd8c7e50d49a403d604e565e0dbb09a790186fe3245725d313ae7cb9 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

# Agente OpenTelemetry (#314): versão e checksum fixos; só é carregado se JAVA_TOOL_OPTIONS o ativar.
FROM maven:3.9-eclipse-temurin-26-alpine@sha256:4c85d516dd8c7e50d49a403d604e565e0dbb09a790186fe3245725d313ae7cb9 AS otel-agent
ARG OTEL_AGENT_VERSION=2.33.1
ARG OTEL_AGENT_SHA256=e43a270df53c6f423e0ab157be9c27ccc01d5dc3232e162fe54777573db2f149
RUN wget -q -O /opentelemetry-javaagent.jar \
        "https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_AGENT_VERSION}/opentelemetry-javaagent.jar" \
    && echo "${OTEL_AGENT_SHA256}  /opentelemetry-javaagent.jar" | sha256sum -c -

FROM eclipse-temurin:25-jre-alpine@sha256:56f273059de6b13a6b49fe0ded691ed2d0399bbee76156a8f2d385f7524a3d43
RUN apk update && apk upgrade --no-cache \
    && addgroup -S app \
    && adduser -S -G app app
WORKDIR /app
COPY --chown=app:app --from=build /app/target/*.jar app.jar
COPY --chown=app:app --from=otel-agent /opentelemetry-javaagent.jar opentelemetry-javaagent.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
