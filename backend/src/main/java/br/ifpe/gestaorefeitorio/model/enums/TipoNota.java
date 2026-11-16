package br.ifpe.gestaorefeitorio.model.enums;

/** Origem da nota de recebimento (US33/#293). */
public enum TipoNota {
    EXTERNA, // recebida de um terceiro, com o número informado por ele
    LOCAL // emitida pela cozinha, com número gerado pelo sistema (NL-AAAA-NNNN)
}
