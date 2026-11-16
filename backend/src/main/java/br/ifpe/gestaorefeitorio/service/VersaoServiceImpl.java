package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.VersaoResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class VersaoServiceImpl implements VersaoService {

    private static final String VERSAO_PADRAO = "dev";

    private final String versao;

    // A versão vem em tempo de execução: a imagem é construída antes da release existir e só depois
    // é promovida para X.Y.Z, então ela não pode ser gravada no build.
    public VersaoServiceImpl(@Value("${app.versao:dev}") String versao) {
        // APP_VERSION= vazia no .env chega como texto vazio, que o padrão do placeholder não cobre.
        this.versao = versao == null || versao.isBlank() ? VERSAO_PADRAO : versao.trim();
    }

    @Override
    public VersaoResponseDTO versaoAtual() {
        return new VersaoResponseDTO(versao);
    }
}
