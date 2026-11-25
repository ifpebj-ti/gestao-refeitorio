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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Simula um banco em uso com e-mails gravados em maiúsculas e um par duplicado sem diferenciar
 * maiúsculas (#468), e confere o que a V30 faz: normaliza, desativa o duplicado sem apagar o histórico
 * dele e passa a recusar e-mail repetido em outra combinação de maiúsculas. Só Flyway + JDBC.
 */
@Testcontainers
class MigrationEmailUsuariosV30Test {

    private static final String ANA = "a0000000-0000-0000-0000-000000000001";
    private static final String JOAO_ANTIGO_INATIVO = "b0000000-0000-0000-0000-000000000002";
    private static final String JOAO_EM_USO = "c0000000-0000-0000-0000-000000000003";

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

    private String consultar(String consulta) throws SQLException {
        try (Connection conexao = conexao();
             Statement sql = conexao.createStatement();
             ResultSet resultado = sql.executeQuery(consulta)) {
            return resultado.next() ? resultado.getString(1) : null;
        }
    }

    @BeforeEach
    void bancoNaVersaoAnterior() {
        flyway(null).clean();
        flyway("29").migrate();
    }

    @Test
    void deveNormalizarEmailsETratarDuplicadosSemPerderHistorico() throws SQLException {
        executar("""
                INSERT INTO usuarios (id, nome, email, perfil, ativo, criado_em, primeiro_acesso_em) VALUES
                    ('%s', 'Ana', 'Ana.Souza@IFPE.edu.br ', 'COZINHA', true, now(), null),
                    ('%s', 'João antigo', 'Joao@IFPE.edu.br', 'COZINHA', false, now() - interval '30 days', null),
                    ('%s', 'João em uso', 'joao@ifpe.edu.br', 'NUTRICIONISTA', true, now(), now())
                """.formatted(ANA, JOAO_ANTIGO_INATIVO, JOAO_EM_USO));
        executar("""
                INSERT INTO movimentacoes (produto_id, local_id, tipo, quantidade, data, origem, valor, responsavel_id)
                VALUES ((SELECT id FROM produtos LIMIT 1), (SELECT id FROM locais_armazenamento LIMIT 1),
                        'ENTRADA', 1, CURRENT_DATE, 'EXTERNA', 1, '%s')
                """.formatted(JOAO_ANTIGO_INATIVO));

        flyway(null).migrate();

        assertThat(consultar("SELECT email FROM usuarios WHERE id = '" + ANA + "'"))
                .isEqualTo("ana.souza@ifpe.edu.br");
        // Fica com o e-mail a conta ativa e que já acessou, mesmo sendo a mais nova.
        assertThat(consultar("SELECT email FROM usuarios WHERE id = '" + JOAO_EM_USO + "'"))
                .isEqualTo("joao@ifpe.edu.br");
        assertThat(consultar("SELECT email FROM usuarios WHERE id = '" + JOAO_ANTIGO_INATIVO + "'"))
                .isEqualTo("joao@ifpe.edu.br#duplicado-b0000000");
        assertThat(consultar("SELECT ativo FROM usuarios WHERE id = '" + JOAO_ANTIGO_INATIVO + "'"))
                .isEqualTo("f");
        assertThat(consultar("SELECT count(*) FROM movimentacoes WHERE responsavel_id = '" + JOAO_ANTIGO_INATIVO + "'"))
                .isEqualTo("1");
    }

    @Test
    void deveDesativarODuplicadoMaisNovoQuandoOsDoisEstaoNaMesmaSituacao() throws SQLException {
        executar("""
                INSERT INTO usuarios (id, nome, email, perfil, ativo, criado_em) VALUES
                    ('%s', 'Mais antigo', 'MARIA@ifpe.edu.br', 'COZINHA', true, now() - interval '1 day'),
                    ('%s', 'Mais novo', 'maria@ifpe.edu.br', 'COZINHA', true, now())
                """.formatted(JOAO_ANTIGO_INATIVO, JOAO_EM_USO));

        flyway(null).migrate();

        assertThat(consultar("SELECT email FROM usuarios WHERE id = '" + JOAO_ANTIGO_INATIVO + "'"))
                .isEqualTo("maria@ifpe.edu.br");
        assertThat(consultar("SELECT ativo FROM usuarios WHERE id = '" + JOAO_EM_USO + "'"))
                .isEqualTo("f");
    }

    @Test
    void indiceDeveRecusarEmailRepetidoEmOutraCombinacaoDeMaiusculas() throws SQLException {
        flyway(null).migrate();
        executar("INSERT INTO usuarios (nome, email, perfil, ativo) VALUES ('Ana', 'ana@ifpe.edu.br', 'COZINHA', true)");

        assertThatThrownBy(() -> executar(
                "INSERT INTO usuarios (nome, email, perfil, ativo) VALUES ('Ana 2', 'ANA@ifpe.edu.br', 'COZINHA', true)"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("uk_usuarios_email_lower");
    }
}
