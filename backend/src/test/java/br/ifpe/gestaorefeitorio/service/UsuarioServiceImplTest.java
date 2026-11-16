package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.DefinirSenhaRequestDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioEdicaoDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioRequestDTO;
import br.ifpe.gestaorefeitorio.dto.UsuarioResponseDTO;
import br.ifpe.gestaorefeitorio.exception.AutoDesativacaoNaoPermitidaException;
import br.ifpe.gestaorefeitorio.exception.EmailJaCadastradoException;
import br.ifpe.gestaorefeitorio.exception.UsuarioNaoEncontradoPorIdException;
import br.ifpe.gestaorefeitorio.model.Usuario;
import br.ifpe.gestaorefeitorio.model.enums.Perfil;
import br.ifpe.gestaorefeitorio.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Cobre os critérios de aceite da US03/#71 na camada de regra de negócio,
 * mockando a persistência.
 */
@ExtendWith(MockitoExtension.class)
class UsuarioServiceImplTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private ConviteService conviteService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TentativasLoginService tentativasLoginService;

    @InjectMocks
    private UsuarioServiceImpl usuarioService;

    private Usuario usuarioComId(UUID id, String email, Perfil perfil, boolean ativo) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome("Usuário " + perfil);
        usuario.setEmail(email);
        usuario.setPerfil(perfil);
        usuario.setAtivo(ativo);
        return usuario;
    }

    @Test
    void deveCadastrarUsuarioComAtivoVerdadeiro() {
        UsuarioRequestDTO request = new UsuarioRequestDTO("Ana Cozinha", "ana@ifpe.edu.br", Perfil.COZINHA);
        when(usuarioRepository.existsByEmail("ana@ifpe.edu.br")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(chamada -> {
            Usuario salvo = chamada.getArgument(0);
            salvo.setId(UUID.randomUUID());
            return salvo;
        });

        UsuarioResponseDTO resposta = usuarioService.cadastrar(request);

        assertThat(resposta.nome()).isEqualTo("Ana Cozinha");
        assertThat(resposta.email()).isEqualTo("ana@ifpe.edu.br");
        assertThat(resposta.perfil()).isEqualTo(Perfil.COZINHA);
        assertThat(resposta.ativo()).isTrue();

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertThat(captor.getValue().isAtivo()).isTrue();
    }

    @Test
    void deveLancarEmailJaCadastradoQuandoEmailDuplicado() {
        UsuarioRequestDTO request = new UsuarioRequestDTO("Outro", "duplicado@ifpe.edu.br", Perfil.NUTRICIONISTA);
        when(usuarioRepository.existsByEmail("duplicado@ifpe.edu.br")).thenReturn(true);

        assertThrows(EmailJaCadastradoException.class, () -> usuarioService.cadastrar(request));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void deveListarTodosMapeandoParaDTO() {
        Usuario u1 = usuarioComId(UUID.randomUUID(), "a@ifpe.edu.br", Perfil.ADMIN, true);
        Usuario u2 = usuarioComId(UUID.randomUUID(), "b@ifpe.edu.br", Perfil.COZINHA, false);
        when(usuarioRepository.findAll()).thenReturn(List.of(u1, u2));

        List<UsuarioResponseDTO> resposta = usuarioService.listarTodos();

        assertThat(resposta).hasSize(2);
        assertThat(resposta.get(0).email()).isEqualTo("a@ifpe.edu.br");
        assertThat(resposta.get(1).ativo()).isFalse();
    }

    @Test
    void deveBuscarPorIdQuandoExiste() {
        UUID id = UUID.randomUUID();
        Usuario usuario = usuarioComId(id, "nutri@ifpe.edu.br", Perfil.NUTRICIONISTA, true);
        when(usuarioRepository.findById(id)).thenReturn(Optional.of(usuario));

        UsuarioResponseDTO resposta = usuarioService.buscarPorId(id);

        assertThat(resposta.id()).isEqualTo(id);
        assertThat(resposta.email()).isEqualTo("nutri@ifpe.edu.br");
    }

    @Test
    void deveLancarNaoEncontradoQuandoBuscarPorIdInexistente() {
        UUID id = UUID.randomUUID();
        when(usuarioRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(UsuarioNaoEncontradoPorIdException.class, () -> usuarioService.buscarPorId(id));
    }

    @Test
    void deveEditarNomeEPerfil() {
        UUID id = UUID.randomUUID();
        Usuario usuario = usuarioComId(id, "cozinha@ifpe.edu.br", Perfil.COZINHA, true);
        when(usuarioRepository.findById(id)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(chamada -> chamada.getArgument(0));

        UsuarioEdicaoDTO request = new UsuarioEdicaoDTO("Novo Nome", Perfil.NUTRICIONISTA);
        UsuarioResponseDTO resposta = usuarioService.editar(id, request);

        assertThat(resposta.nome()).isEqualTo("Novo Nome");
        assertThat(resposta.perfil()).isEqualTo(Perfil.NUTRICIONISTA);
    }

    @Test
    void deveLancarNaoEncontradoQuandoEditarIdInexistente() {
        UUID id = UUID.randomUUID();
        when(usuarioRepository.findById(id)).thenReturn(Optional.empty());

        UsuarioEdicaoDTO request = new UsuarioEdicaoDTO("Nome", Perfil.ADMIN);

        assertThrows(UsuarioNaoEncontradoPorIdException.class, () -> usuarioService.editar(id, request));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void deveDesativarUsuarioExistente() {
        UUID idAlvo = UUID.randomUUID();
        UUID idAdmin = UUID.randomUUID();
        Usuario alvo = usuarioComId(idAlvo, "cozinha@ifpe.edu.br", Perfil.COZINHA, true);
        Usuario admin = usuarioComId(idAdmin, "admin@ifpe.edu.br", Perfil.ADMIN, true);

        when(usuarioRepository.findById(idAlvo)).thenReturn(Optional.of(alvo));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(chamada -> chamada.getArgument(0));

        UsuarioResponseDTO resposta = usuarioService.desativar(idAlvo, admin);

        assertThat(resposta.ativo()).isFalse();
    }

    @Test
    void deveLancarNaoEncontradoQuandoDesativarIdInexistente() {
        UUID idAlvo = UUID.randomUUID();
        Usuario admin = usuarioComId(UUID.randomUUID(), "admin@ifpe.edu.br", Perfil.ADMIN, true);
        when(usuarioRepository.findById(idAlvo)).thenReturn(Optional.empty());

        assertThrows(UsuarioNaoEncontradoPorIdException.class, () -> usuarioService.desativar(idAlvo, admin));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void deveBloquearAutodesativacaoDoProprioAdmin() {
        UUID id = UUID.randomUUID();
        Usuario admin = usuarioComId(id, "admin@ifpe.edu.br", Perfil.ADMIN, true);
        when(usuarioRepository.findById(id)).thenReturn(Optional.of(admin));

        assertThrows(AutoDesativacaoNaoPermitidaException.class, () -> usuarioService.desativar(id, admin));

        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void deveDefinirSenhaComHashELiberarBloqueioDeTentativas() {
        UUID id = UUID.randomUUID();
        Usuario usuario = usuarioComId(id, "Nutri@IFPE.edu.br", Perfil.NUTRICIONISTA, true);
        Usuario admin = usuarioComId(UUID.randomUUID(), "admin@ifpe.edu.br", Perfil.ADMIN, true);
        when(usuarioRepository.findById(id)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.encode("senha-nova-1234")).thenReturn("hash-bcrypt");

        usuarioService.definirSenha(id, new DefinirSenhaRequestDTO("senha-nova-1234"), admin);

        assertThat(usuario.getSenhaHash()).isEqualTo("hash-bcrypt");
        verify(usuarioRepository).save(usuario);
        verify(tentativasLoginService).limpar("nutri@ifpe.edu.br");
    }

    @Test
    void deveRemoverSenhaELiberarBloqueioDeTentativas() {
        UUID id = UUID.randomUUID();
        Usuario usuario = usuarioComId(id, "cozinha@ifpe.edu.br", Perfil.COZINHA, true);
        usuario.setSenhaHash("hash-antigo");
        Usuario admin = usuarioComId(UUID.randomUUID(), "admin@ifpe.edu.br", Perfil.ADMIN, true);
        when(usuarioRepository.findById(id)).thenReturn(Optional.of(usuario));

        usuarioService.removerSenha(id, admin);

        assertThat(usuario.getSenhaHash()).isNull();
        verify(usuarioRepository).save(usuario);
        verify(tentativasLoginService).limpar("cozinha@ifpe.edu.br");
    }

    @Test
    void deveLancarExcecaoAoDefinirOuRemoverSenhaDeUsuarioInexistente() {
        UUID id = UUID.randomUUID();
        Usuario admin = usuarioComId(UUID.randomUUID(), "admin@ifpe.edu.br", Perfil.ADMIN, true);
        when(usuarioRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(UsuarioNaoEncontradoPorIdException.class,
                () -> usuarioService.definirSenha(id, new DefinirSenhaRequestDTO("senha-nova-1234"), admin));
        assertThrows(UsuarioNaoEncontradoPorIdException.class, () -> usuarioService.removerSenha(id, admin));

        verify(usuarioRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder, tentativasLoginService);
    }

    @Test
    void deveInformarSeOUsuarioPossuiSenhaLocal() {
        UUID comSenha = UUID.randomUUID();
        UUID semSenha = UUID.randomUUID();
        Usuario usuarioComSenha = usuarioComId(comSenha, "com@ifpe.edu.br", Perfil.NUTRICIONISTA, true);
        usuarioComSenha.setSenhaHash("hash");
        when(usuarioRepository.findById(comSenha)).thenReturn(Optional.of(usuarioComSenha));
        when(usuarioRepository.findById(semSenha))
                .thenReturn(Optional.of(usuarioComId(semSenha, "sem@ifpe.edu.br", Perfil.COZINHA, true)));

        assertThat(usuarioService.buscarPorId(comSenha).possuiSenhaLocal()).isTrue();
        assertThat(usuarioService.buscarPorId(semSenha).possuiSenhaLocal()).isFalse();
    }
}
