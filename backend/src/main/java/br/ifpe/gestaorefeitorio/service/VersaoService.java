package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.dto.VersaoResponseDTO;

public interface VersaoService {

    /** Versão da aplicação em execução, vinda de {@code APP_VERSION}; "dev" quando não definida (#371). */
    VersaoResponseDTO versaoAtual();
}
