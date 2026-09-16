package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.AuthResponseDTO;
import br.ifpe.gestaorefeitorio.exception.TokenGoogleInvalidoException;
import br.ifpe.gestaorefeitorio.exception.UsuarioInativoException;
import br.ifpe.gestaorefeitorio.exception.UsuarioNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import br.ifpe.gestaorefeitorio.security.GoogleTokenValidator;
import br.ifpe.gestaorefeitorio.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

/**
 * Cobre os critérios de aceite da US01/#62 na camada de regra de negócio,
 * mockando a fronteira externa (validação do token junto ao Google) e a persistência.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private GoogleTokenValidator googleTokenValidator;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthServiceImpl authService;

    private GoogleIdToken.Payload payloadComEmail(String email) {
        GoogleIdToken.Payload payload = new GoogleIdToken.Payload();
        payload.setEmail(email);
        return payload;
    }

    @Test
    void deveGerarTokenQuandoUsuarioCadastradoEAtivo() {
        String idToken = "id-token-valido";
        String email = "nutricionista@ifpe.edu.br";

        Usuario usuario = new Usuario();
        usuario.setNome("Maria Nutricionista");
        usuario.setEmail(email);
        usuario.setPerfil(Perfil.NUTRICIONISTA);
        usuario.setAtivo(true);

        when(googleTokenValidator.validar(idToken)).thenReturn(payloadComEmail(email));
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.of(usuario));
        when(jwtService.gerarToken(email, Perfil.NUTRICIONISTA.name())).thenReturn("jwt-gerado");

        AuthResponseDTO resposta = authService.autenticarComGoogle(idToken);

        assertThat(resposta.token()).isEqualTo("jwt-gerado");
        assertThat(resposta.email()).isEqualTo(email);
        assertThat(resposta.nome()).isEqualTo("Maria Nutricionista");
        assertThat(resposta.perfil()).isEqualTo(Perfil.NUTRICIONISTA);
        verify(jwtService).gerarToken(email, Perfil.NUTRICIONISTA.name());
    }

    @Test
    void deveLancarTokenGoogleInvalidoQuandoTokenInvalidoOuExpirado() {
        String idToken = "id-token-invalido";
        when(googleTokenValidator.validar(idToken)).thenThrow(new TokenGoogleInvalidoException());

        assertThrows(TokenGoogleInvalidoException.class,
                () -> authService.autenticarComGoogle(idToken));

        verifyNoInteractions(usuarioRepository, jwtService);
    }

    @Test
    void deveLancarUsuarioNaoEncontradoQuandoEmailNaoCadastrado() {
        String idToken = "id-token-valido";
        String email = "desconhecido@ifpe.edu.br";

        when(googleTokenValidator.validar(idToken)).thenReturn(payloadComEmail(email));
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.empty());

        assertThrows(UsuarioNaoEncontradoException.class,
                () -> authService.autenticarComGoogle(idToken));

        verifyNoInteractions(jwtService);
    }

    @Test
    void deveLancarUsuarioInativoQuandoUsuarioDesativado() {
        String idToken = "id-token-valido";
        String email = "cozinha@ifpe.edu.br";

        Usuario usuario = new Usuario();
        usuario.setNome("Cozinha Inativa");
        usuario.setEmail(email);
        usuario.setPerfil(Perfil.COZINHA);
        usuario.setAtivo(false);

        when(googleTokenValidator.validar(idToken)).thenReturn(payloadComEmail(email));
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.of(usuario));

        assertThrows(UsuarioInativoException.class,
                () -> authService.autenticarComGoogle(idToken));

        verifyNoInteractions(jwtService);
    }
}
