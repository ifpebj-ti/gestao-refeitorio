package br.ifpe.gestaorefeitorio.repository;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Simula um banco já em uso (como na OCI) antes da limpeza dos usuários da V18 (#207):
 * quem tem histórico fica, quem não tem é removido. Usa só Flyway + JDBC, sem contexto Spring.
 */
@Testcontainers
class MigrationLimpezaV18Test {

    private static final String NUTRICIONISTA_V18 = "b1ff4806-93f9-4ad1-82b2-b56671dfa721";

    @Container
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    private Flyway flyway(String alvo) {
        var config = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .locations("classpath:db/migration");
        return (alvo == null ? config : config.target(alvo)).load();
    }

    private Connection conexao() throws SQLException {
        return DriverManager.getConnection(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
    }

    @Test
    void deveManterUsuarioDaV18ComMovimentacaoERemoverOsDemais() throws SQLException {
        flyway("23").migrate();

        try (Connection conexao = conexao(); Statement sql = conexao.createStatement()) {
            sql.executeUpdate("""
                    INSERT INTO movimentacoes (produto_id, local_id, tipo, quantidade, data, origem, valor, responsavel_id)
                    VALUES ((SELECT id FROM produtos LIMIT 1), (SELECT id FROM locais_armazenamento LIMIT 1),
                            'ENTRADA', 1, CURRENT_DATE, 'EXTERNA', 1, '%s')
                    """.formatted(NUTRICIONISTA_V18));
        }

        flyway(null).migrate();

        List<String> restantes = new ArrayList<>();
        try (Connection conexao = conexao();
             Statement sql = conexao.createStatement();
             ResultSet resultado = sql.executeQuery("""
                     SELECT email FROM usuarios
                     WHERE id IN ('7c139eb0-bd2b-4692-840e-29e517058a20',
                                  'b1ff4806-93f9-4ad1-82b2-b56671dfa721',
                                  '3f5ebd20-ea67-4d77-83e7-a59b348f311d')
                     """)) {
            while (resultado.next()) {
                restantes.add(resultado.getString("email"));
            }
        }

        assertThat(restantes).containsExactly("rsro@discente.ifpe.edu.br");
    }
}
