package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.dto.LoginLocalRequestDTO;
import br.ifpe.gestaorefeitorio.exception.CredenciaisInvalidasException;
import br.ifpe.gestaorefeitorio.exception.LoginBloqueadoException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoginLocalServiceImplTest {

    private static final String EMAIL = "nutri@ifpe.edu.br";
    private static final String SENHA = "senha-correta-123";

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private TentativasLoginService tentativasLoginService;

    // BCrypt real com custo mínimo: o teste confere o hash de verdade sem ficar lento.
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

    private LoginLocalServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new LoginLocalServiceImpl(usuarioRepository, jwtService, passwordEncoder, tentativasLoginService);
    }

    private Usuario usuario(String senha, boolean ativo) {
        Usuario usuario = new Usuario();
        usuario.setEmail(EMAIL);
        usuario.setNome("Nutricionista");
        usuario.setPerfil(Perfil.NUTRICIONISTA);
        usuario.setAtivo(ativo);
        usuario.setSenhaHash(senha == null ? null : passwordEncoder.encode(senha));
        return usuario;
    }

    @Test
    void deveAutenticarRegistrarSucessoEPrimeiroAcesso() {
        Usuario usuario = usuario(SENHA, true);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario));
        when(jwtService.gerarToken(EMAIL, "NUTRICIONISTA")).thenReturn("jwt");

        AuthResponseDTO resposta = service.autenticar(new LoginLocalRequestDTO(" NUTRI@ifpe.edu.br ", SENHA));

        assertThat(resposta.token()).isEqualTo("jwt");
        assertThat(resposta.perfil()).isEqualTo(Perfil.NUTRICIONISTA);
        assertThat(usuario.getPrimeiroAcessoEm()).isNotNull();
        verify(tentativasLoginService).registrarSucesso(EMAIL);
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void deveNegarEmailInexistente() {
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThrows(CredenciaisInvalidasException.class,
                () -> service.autenticar(new LoginLocalRequestDTO(EMAIL, SENHA)));
        verify(tentativasLoginService).registrarFalha(EMAIL);
    }

    @Test
    void deveNegarSenhaErrada() {
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario(SENHA, true)));

        assertThrows(CredenciaisInvalidasException.class,
                () -> service.autenticar(new LoginLocalRequestDTO(EMAIL, "senha-errada-123")));
        verify(tentativasLoginService).registrarFalha(EMAIL);
        verify(jwtService, never()).gerarToken(any(), any());
    }

    @Test
    void deveNegarUsuarioSemSenhaLocal() {
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario(null, true)));

        assertThrows(CredenciaisInvalidasException.class,
                () -> service.autenticar(new LoginLocalRequestDTO(EMAIL, SENHA)));
        verify(tentativasLoginService).registrarFalha(EMAIL);
    }

    @Test
    void deveNegarUsuarioInativoMesmoComSenhaCerta() {
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario(SENHA, false)));

        assertThrows(CredenciaisInvalidasException.class,
                () -> service.autenticar(new LoginLocalRequestDTO(EMAIL, SENHA)));
        verify(tentativasLoginService).registrarFalha(EMAIL);
        verify(jwtService, never()).gerarToken(any(), any());
    }

    @Test
    void deveNegarSenhaAcimaDe72Bytes() {
        String senhaLonga = "a".repeat(73);
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuario(SENHA, true)));

        assertThrows(CredenciaisInvalidasException.class,
                () -> service.autenticar(new LoginLocalRequestDTO(EMAIL, senhaLonga)));
        verify(tentativasLoginService).registrarFalha(EMAIL);
    }

    @Test
    void deveRecusarComBloqueioAntesDeConsultarOUsuario() {
        doThrow(new LoginBloqueadoException(900)).when(tentativasLoginService).verificarBloqueio(EMAIL);

        assertThrows(LoginBloqueadoException.class,
                () -> service.autenticar(new LoginLocalRequestDTO(EMAIL, SENHA)));
        verifyNoInteractions(usuarioRepository, jwtService);
    }
}
