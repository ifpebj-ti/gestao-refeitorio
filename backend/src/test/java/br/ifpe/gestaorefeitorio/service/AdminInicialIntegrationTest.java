package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * Sobe a aplicação inteira com ADMIN_INICIAL_EMAIL definido e um banco novo (#207):
 * o ADMIN é criado no boot, e uma segunda execução (como num novo deploy) não muda nada.
 */
@SpringBootTest(properties = "admin.inicial.email=admin.inicial@ifpe.edu.br")
@Testcontainers
class AdminInicialIntegrationTest {

    @Container
    @ServiceConnection
    @SuppressWarnings("resource")
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AdminInicialService adminInicialService;

    @MockitoBean
    private ConviteService conviteService;

    @Test
    void deveCriarAdminInicialNoBootENaoRepetirNaSegundaExecucao() {
        List<Usuario> admins = usuarioRepository.findByPerfilAndAtivoTrue(Perfil.ADMIN);
        assertThat(admins).extracting(Usuario::getEmail).containsExactly("admin.inicial@ifpe.edu.br");
        verify(conviteService, times(1)).enviarConvite(any());

        adminInicialService.garantirAdminInicial();

        assertThat(usuarioRepository.findByPerfilAndAtivoTrue(Perfil.ADMIN)).hasSize(1);
        verify(conviteService, times(1)).enviarConvite(any());
    }
}
