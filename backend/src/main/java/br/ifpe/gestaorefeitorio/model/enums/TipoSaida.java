package br.ifpe.gestaorefeitorio.model.enums;

/** Motivo de uma saída de estoque (obrigatório só quando Movimentacao.tipo = SAIDA). */
public enum TipoSaida {
    CONSUMO,
    PERDA,
    DESCARTE,
    OUTRO
}
