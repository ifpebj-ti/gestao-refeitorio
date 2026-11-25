package br.ifpe.gestaorefeitorio.repository;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Simula o banco de produção com a tabela de locais esvaziada por fora das migrations (#473)
 * e confere que a V29 restaura os locais padrão sem duplicar onde eles ainda existem.
 * Usa só Flyway + JDBC, sem contexto Spring.
 */
@Testcontainers
class MigrationLocaisArmazenamentoV29Test {

    private static final String DESPENSA = "eddeb319-7af8-4d68-bd88-8a739c968c74";
    private static final String CONGELADOS = "e10aa4e1-9b74-4791-8b01-1a8efd93af8c";

    @Container
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    private Flyway flyway(String alvo) {
        var config = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration")
                .cleanDisabled(false);
        return (alvo == null ? config : config.target(alvo)).load();
    }

    private Connection conexao() throws SQLException {
        return DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }

    private void executar(String comando) throws SQLException {
        try (Connection conexao = conexao(); Statement sql = conexao.createStatement()) {
            sql.executeUpdate(comando);
        }
    }

    private Map<String, String> locaisPorNome() throws SQLException {
        Map<String, String> locais = new LinkedHashMap<>();
        try (Connection conexao = conexao();
             Statement sql = conexao.createStatement();
             ResultSet resultado = sql.executeQuery("SELECT id, nome FROM locais_armazenamento ORDER BY nome")) {
            while (resultado.next()) {
                locais.put(resultado.getString("nome"), resultado.getString("id"));
            }
        }
        return locais;
    }

    @BeforeEach
    void bancoNaVersaoAnterior() {
        flyway(null).clean();
        flyway("28").migrate();
    }

    @Test
    void deveRestaurarOsLocaisPadraoComOsUuidsDaV4QuandoATabelaEstaVazia() throws SQLException {
        executar("DELETE FROM locais_armazenamento");

        flyway(null).migrate();

        assertThat(locaisPorNome()).containsExactly(
                Map.entry("Congelados/Refrigerados", CONGELADOS),
                Map.entry("Despensa", DESPENSA));
    }

    @Test
    void naoDeveAlterarNadaQuandoOsLocaisJaExistem() throws SQLException {
        Map<String, String> antes = locaisPorNome();

        flyway(null).migrate();

        assertThat(locaisPorNome()).isEqualTo(antes).hasSize(2);
    }

    @Test
    void naoDeveDuplicarLocalRecriadoComOutroIdEDeveRestaurarOQueFalta() throws SQLException {
        executar("DELETE FROM locais_armazenamento");
        executar("INSERT INTO locais_armazenamento (nome) VALUES ('Despensa')");
        String despensaRecriada = locaisPorNome().get("Despensa");

        flyway(null).migrate();

        assertThat(locaisPorNome()).containsExactly(
                Map.entry("Congelados/Refrigerados", CONGELADOS),
                Map.entry("Despensa", despensaRecriada));
    }

    @Test
    void naoDeveFalharQuandoOutroLocalJaUsaUmDosUuidsPadrao() throws SQLException {
        executar("DELETE FROM locais_armazenamento");
        executar("INSERT INTO locais_armazenamento (id, nome) VALUES ('" + DESPENSA + "', 'Despensa Principal')");

        flyway(null).migrate();

        assertThat(locaisPorNome()).containsExactly(
                Map.entry("Congelados/Refrigerados", CONGELADOS),
                Map.entry("Despensa Principal", DESPENSA));
    }
}
