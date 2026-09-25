package br.ifpe.gestaorefeitorio.exception;

import java.math.BigDecimal;

public class SaldoInsuficienteException extends RuntimeException {
    public SaldoInsuficienteException(BigDecimal saldoDisponivel, BigDecimal quantidadeSolicitada) {
        super("Saldo insuficiente: disponível " + saldoDisponivel + ", solicitado " + quantidadeSolicitada);
    }
}
