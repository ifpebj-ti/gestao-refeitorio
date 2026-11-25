package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.LocalArmazenamentoResponseDTO;
import br.ifpe.gestaorefeitorio.model.LocalArmazenamento;
import br.ifpe.gestaorefeitorio.repository.LocalArmazenamentoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LocalArmazenamentoServiceImplTest {

    @Mock
    private LocalArmazenamentoRepository localArmazenamentoRepository;

    @InjectMocks
    private LocalArmazenamentoServiceImpl localArmazenamentoService;

    private LocalArmazenamento local(UUID id, String nome) {
        LocalArmazenamento local = new LocalArmazenamento();
        local.setId(id);
        local.setNome(nome);
        return local;
    }

    @Test
    void deveListarOsLocaisOrdenadosPorNomeComoDTO() {
        UUID congelados = UUID.randomUUID();
        UUID despensa = UUID.randomUUID();
        when(localArmazenamentoRepository.findAll(Sort.by("nome"))).thenReturn(List.of(
                local(congelados, "Congelados/Refrigerados"),
                local(despensa, "Despensa")));

        List<LocalArmazenamentoResponseDTO> locais = localArmazenamentoService.listar();

        assertThat(locais).containsExactly(
                new LocalArmazenamentoResponseDTO(congelados, "Congelados/Refrigerados"),
                new LocalArmazenamentoResponseDTO(despensa, "Despensa"));
    }

    @Test
    void deveRetornarListaVaziaQuandoNaoHaLocais() {
        when(localArmazenamentoRepository.findAll(Sort.by("nome"))).thenReturn(List.of());

        assertThat(localArmazenamentoService.listar()).isEmpty();
    }
}
