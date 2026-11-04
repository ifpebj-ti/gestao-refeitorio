package br.ifpe.gestaorefeitorio.exception;

import br.ifpe.gestaorefeitorio.model.enums.StatusNota;

// Usada por toda operação que só vale para nota PENDENTE (edição #289, validação e cancelamento).
public class NotaNaoPendenteException extends RuntimeException {
    public NotaNaoPendenteException(StatusNota status) {
        super("Nota " + status + " não pode ser alterada; só notas PENDENTE");
    }
}
