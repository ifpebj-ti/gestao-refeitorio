package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminLocalServiceImplTest {

    private static final String EMAIL = "admin.local@ifpe.edu.br";
    private static final String SENHA = "senha-do-admin-123";

    @Mock
    private UsuarioRepository usuarioRepository;

    // BCrypt real com custo mínimo: o teste confere o hash de verdade sem ficar lento.
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

    private AdminLocalServiceImpl service(String email, String senha) {
        return new AdminLocalServiceImpl(usuarioRepository, passwordEncoder, email, "Admin Local", senha);
    }

    private Usuario existente(Perfil perfil, String senhaHash, boolean ativo) {
        Usuario usuario = new Usuario();
        usuario.setEmail(EMAIL);
        usuario.setNome("Existente");
        usuario.setPerfil(perfil);
        usuario.setAtivo(ativo);
        usuario.setSenhaHash(senhaHash);
        return usuario;
    }

    @Test
    void naoDeveFazerNadaSemConfiguracao() {
        service("", "").garantirAdminLocal();

        verifyNoInteractions(usuarioRepository);
    }

    @Test
    void naoDeveFazerNadaComConfiguracaoPelaMetade() {
        service(EMAIL, "").garantirAdminLocal();
        service("", SENHA).garantirAdminLocal();

        verifyNoInteractions(usuarioRepository);
    }

    @Test
    void naoDeveFazerNadaComEmailInvalido() {
        service("nao-e-email", SENHA).garantirAdminLocal();

        verifyNoInteractions(usuarioRepository);
    }

    @Test
    void naoDeveCriarComSenhaCurta() {
        service(EMAIL, "curta-123").garantirAdminLocal();

        verifyNoInteractions(usuarioRepository);
    }

    @Test
    void naoDeveCriarComSenhaAcimaDe72Bytes() {
        service(EMAIL, "a".repeat(73)).garantirAdminLocal();

        verifyNoInteractions(usuarioRepository);
    }

    @Test
    void deveCriarAdminAtivoComSenhaEmHashEEmailNormalizado() {
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        service("  Admin.Local@IFPE.edu.br ", SENHA).garantirAdminLocal();

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario criado = captor.getValue();
        assertThat(criado.getEmail()).isEqualTo(EMAIL);
        assertThat(criado.getNome()).isEqualTo("Admin Local");
        assertThat(criado.getPerfil()).isEqualTo(Perfil.ADMIN);
        assertThat(criado.isAtivo()).isTrue();
        assertThat(criado.getSenhaHash()).isNotEqualTo(SENHA);
        assertThat(passwordEncoder.matches(SENHA, criado.getSenhaHash())).isTrue();
    }

    @Test
    void deveDefinirSenhaDeAdminExistenteSemSenha() {
        Usuario admin = existente(Perfil.ADMIN, null, true);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(admin));

        service(EMAIL, SENHA).garantirAdminLocal();

        assertThat(passwordEncoder.matches(SENHA, admin.getSenhaHash())).isTrue();
        verify(usuarioRepository).save(admin);
    }

    @Test
    void naoDeveReativarAdminInativoAoDefinirASenha() {
        Usuario admin = existente(Perfil.ADMIN, null, false);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(admin));

        service(EMAIL, SENHA).garantirAdminLocal();

        assertThat(admin.getSenhaHash()).isNotNull();
        assertThat(admin.isAtivo()).isFalse();
    }

    @Test
    void naoDeveAlterarUsuarioQueNaoEAdmin() {
        Usuario nutricionista = existente(Perfil.NUTRICIONISTA, null, true);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(nutricionista));

        service(EMAIL, SENHA).garantirAdminLocal();

        assertThat(nutricionista.getSenhaHash()).isNull();
        assertThat(nutricionista.getPerfil()).isEqualTo(Perfil.NUTRICIONISTA);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void naoDeveSobrescreverSenhaJaDefinida() {
        String hashAtual = passwordEncoder.encode("senha-trocada-depois");
        Usuario admin = existente(Perfil.ADMIN, hashAtual, true);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(admin));

        service(EMAIL, SENHA).garantirAdminLocal();

        assertThat(admin.getSenhaHash()).isEqualTo(hashAtual);
        verify(usuarioRepository, never()).save(any());
    }
}
