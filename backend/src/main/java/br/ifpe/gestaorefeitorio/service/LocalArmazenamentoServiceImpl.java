package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.LocalArmazenamentoResponseDTO;
import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocalArmazenamentoServiceImpl implements LocalArmazenamentoService {

    private static final Sort ORDEM_POR_NOME = Sort.by("nome");

    private final LocalArmazenamentoRepository localArmazenamentoRepository;

    @Override
    public List<LocalArmazenamentoResponseDTO> listar() {
        List<LocalArmazenamentoResponseDTO> locais = localArmazenamentoRepository.findAll(ORDEM_POR_NOME).stream()
                .map(this::paraDTO)
                .toList();
        log.debug("Listagem de locais de armazenamento: {} encontrados", locais.size());
        return locais;
    }

    private LocalArmazenamentoResponseDTO paraDTO(LocalArmazenamento local) {
        return new LocalArmazenamentoResponseDTO(local.getId(), local.getNome());
    }
}
