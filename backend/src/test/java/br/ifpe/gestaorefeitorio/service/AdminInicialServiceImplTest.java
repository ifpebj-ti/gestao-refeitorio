package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.exception.EnvioEmailException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Cobre os critérios de aceite da #207 na camada de regra de negócio, mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class AdminInicialServiceImplTest {

    private static final String EMAIL = "admin@ifpe.edu.br";

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ConviteService conviteService;

    private AdminInicialServiceImpl servico(String email) {
        return new AdminInicialServiceImpl(usuarioRepository, conviteService, email, "Admin Inicial");
    }

    private Usuario salvo() {
        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void deveCriarAdminAtivoEEnviarConviteQuandoNaoExisteAdmin() {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(Perfil.ADMIN)).thenReturn(false);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(chamada -> chamada.getArgument(0));

        servico(EMAIL).garantirAdminInicial();

        Usuario admin = salvo();
        assertThat(admin.getEmail()).isEqualTo(EMAIL);
        assertThat(admin.getNome()).isEqualTo("Admin Inicial");
        assertThat(admin.getPerfil()).isEqualTo(Perfil.ADMIN);
        assertThat(admin.isAtivo()).isTrue();
        verify(conviteService).enviarConvite(admin);
    }

    @Test
    void naoDeveFazerNadaQuandoJaExisteAdminAtivo() {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(Perfil.ADMIN)).thenReturn(true);

        servico("outro@ifpe.edu.br").garantirAdminInicial();

        verify(usuarioRepository, never()).save(any());
        verifyNoInteractions(conviteService);
    }

    @Test
    void devePromoverEReativarUsuarioExistenteComOutroPerfil() {
        Usuario existente = new Usuario();
        existente.setNome("Já cadastrada");
        existente.setEmail(EMAIL);
        existente.setPerfil(Perfil.NUTRICIONISTA);
        existente.setAtivo(false);
        when(usuarioRepository.existsByPerfilAndAtivoTrue(Perfil.ADMIN)).thenReturn(false);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(existente));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(chamada -> chamada.getArgument(0));

        servico(EMAIL).garantirAdminInicial();

        Usuario admin = salvo();
        assertThat(admin).isSameAs(existente);
        assertThat(admin.getPerfil()).isEqualTo(Perfil.ADMIN);
        assertThat(admin.isAtivo()).isTrue();
        assertThat(admin.getNome()).isEqualTo("Já cadastrada");
        verify(conviteService).enviarConvite(existente);
    }

    @Test
    void deveManterAdminCriadoQuandoEnvioDoConviteFalha() {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(Perfil.ADMIN)).thenReturn(false);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(chamada -> chamada.getArgument(0));
        doThrow(new EnvioEmailException(new RuntimeException("SMTP fora do ar")))
                .when(conviteService).enviarConvite(any());

        servico(EMAIL).garantirAdminInicial();

        assertThat(salvo().getPerfil()).isEqualTo(Perfil.ADMIN);
    }

    @ParameterizedTest
    @ValueSource(strings = { "", "   ", "sem-arroba", "a@b", "duas@@arrobas.com" })
    void naoDeveCriarAdminQuandoEmailAusenteOuInvalido(String email) {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(Perfil.ADMIN)).thenReturn(false);

        servico(email).garantirAdminInicial();

        verify(usuarioRepository, never()).save(any());
        verifyNoInteractions(conviteService);
    }

    @Test
    void naoDeveCriarAdminQuandoEmailNulo() {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(Perfil.ADMIN)).thenReturn(false);

        servico(null).garantirAdminInicial();

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void deveNormalizarEmailAntesDeGravar() {
        when(usuarioRepository.existsByPerfilAndAtivoTrue(Perfil.ADMIN)).thenReturn(false);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(chamada -> chamada.getArgument(0));

        servico("  Admin@IFPE.edu.br ").garantirAdminInicial();

        assertThat(salvo().getEmail()).isEqualTo(EMAIL);
    }
}
