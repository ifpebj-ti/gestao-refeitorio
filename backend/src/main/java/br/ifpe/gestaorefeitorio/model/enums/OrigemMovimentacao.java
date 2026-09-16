package br.ifpe.gestaorefeitorio.model.enums;

/** Origem de uma movimentação de entrada no estoque. */
public enum OrigemMovimentacao {
    EXTERNA, // comprado de fornecedor externo
    AGROINDUSTRIA, // recebido da Agroindústria do campus
    INTERNA // outras áreas produtivas do campus
}
