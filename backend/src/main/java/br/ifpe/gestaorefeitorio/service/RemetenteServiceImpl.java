package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.RemetenteRequestDTO;
import br.ifpe.gestaorefeitorio.dto.RemetenteResponseDTO;
import br.ifpe.gestaorefeitorio.exception.RemetenteJaCadastradoException;
import br.ifpe.gestaorefeitorio.exception.RemetenteNaoEncontradoException;
import br.ifpe.gestaorefeitorio.model.Remetente;
import br.ifpe.gestaorefeitorio.repository.RemetenteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

// O documento (CPF de pessoa física é dado pessoal, LGPD) nunca vai para os logs: só ID e nome.
@Slf4j
@Service
@RequiredArgsConstructor
public class RemetenteServiceImpl implements RemetenteService {

    private static final Sort ORDEM_POR_NOME = Sort.by("nome");

    private final RemetenteRepository remetenteRepository;

    @Override
    public RemetenteResponseDTO cadastrar(RemetenteRequestDTO request) {
        String nome = request.nome().trim();
        if (remetenteRepository.findByNomeIgnoreCase(nome).isPresent()) {
            log.info("Cadastro de remetente negado: nome '{}' já cadastrado", nome);
            throw new RemetenteJaCadastradoException();
        }

        Remetente remetente = new Remetente();
        preencher(remetente, nome, request);
        remetente.setAtivo(true);
        remetente = remetenteRepository.save(remetente);

        log.info("Remetente cadastrado: {} ({})", remetente.getId(), remetente.getNome());
        return paraDTO(remetente);
    }

    @Override
    public List<RemetenteResponseDTO> listar(Boolean ativo) {
        List<Remetente> remetentes = ativo == null
                ? remetenteRepository.findAll(ORDEM_POR_NOME)
                : remetenteRepository.findByAtivo(ativo, ORDEM_POR_NOME);
        return remetentes.stream().map(this::paraDTO).toList();
    }

    @Override
    public RemetenteResponseDTO buscarPorId(UUID id) {
        return paraDTO(buscarEntidade(id));
    }

    @Override
    public RemetenteResponseDTO editar(UUID id, RemetenteRequestDTO request) {
        Remetente remetente = buscarEntidade(id);
        String nome = request.nome().trim();
        if (remetenteRepository.existsByNomeIgnoreCaseAndIdNot(nome, id)) {
            log.info("Edição do remetente {} negada: nome '{}' já cadastrado", id, nome);
            throw new RemetenteJaCadastradoException();
        }

        preencher(remetente, nome, request);
        remetente = remetenteRepository.save(remetente);

        log.debug("Remetente editado: {} ({})", remetente.getId(), remetente.getNome());
        return paraDTO(remetente);
    }

    @Override
    public RemetenteResponseDTO inativar(UUID id) {
        Remetente remetente = buscarEntidade(id);
        remetente.setAtivo(false);
        remetente = remetenteRepository.save(remetente);

        log.info("Remetente inativado: {} ({})", remetente.getId(), remetente.getNome());
        return paraDTO(remetente);
    }

    @Override
    public RemetenteResponseDTO reativar(UUID id) {
        Remetente remetente = buscarEntidade(id);
        remetente.setAtivo(true);
        remetente = remetenteRepository.save(remetente);

        log.info("Remetente reativado: {} ({})", remetente.getId(), remetente.getNome());
        return paraDTO(remetente);
    }

    private void preencher(Remetente remetente, String nome, RemetenteRequestDTO request) {
        remetente.setNome(nome);
        remetente.setDocumento(somenteDigitos(request.documento()));
        remetente.setContato(request.contato() == null || request.contato().isBlank()
                ? null
                : request.contato().trim());
    }

    // O formato (11 ou 14 dígitos) já foi validado no DTO; aqui só tira a máscara.
    private String somenteDigitos(String documento) {
        if (documento == null || documento.isBlank()) {
            return null;
        }
        return documento.replaceAll("\\D", "");
    }

    private Remetente buscarEntidade(UUID id) {
        return remetenteRepository.findById(id)
                .orElseThrow(() -> new RemetenteNaoEncontradoException(id));
    }

    private RemetenteResponseDTO paraDTO(Remetente remetente) {
        return new RemetenteResponseDTO(
                remetente.getId(),
                remetente.getNome(),
                remetente.getDocumento(),
                remetente.getContato(),
                remetente.isAtivo(),
                remetente.getCriadoEm());
    }
}
