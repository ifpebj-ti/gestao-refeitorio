package br.ifpe.gestaorefeitorio.service;

import br.ifpe.gestaorefeitorio.exception.LoginBloqueadoException;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Em memória porque a aplicação roda numa instância só; reiniciar o backend zera os bloqueios.
@Service
public class TentativasLoginServiceImpl implements TentativasLoginService {

    static final int MAXIMO_FALHAS = 5;
    static final Duration DURACAO_BLOQUEIO = Duration.ofMinutes(15);
    // Falhas mais antigas que isso deixam de contar: "seguidas" é dentro dessa janela.
    static final Duration JANELA_FALHAS = Duration.ofMinutes(15);
    // Acima disso, os registros vencidos são descartados, para e-mails aleatórios não crescerem a memória.
    static final int LIMITE_REGISTROS = 10_000;

    private final Clock clock;
    private final Map<String, Registro> registros = new ConcurrentHashMap<>();

    public TentativasLoginServiceImpl(Clock clock) {
        this.clock = clock;
    }

    @Override
    public void verificarBloqueio(String email) {
        Instant agora = clock.instant();
        Registro registro = registros.get(email);
        if (registro == null || registro.bloqueadoAte() == null) {
            return;
        }
        if (agora.isBefore(registro.bloqueadoAte())) {
            long segundos = Math.max(1, Duration.between(agora, registro.bloqueadoAte()).toSeconds());
            throw new LoginBloqueadoException(segundos);
        }
        registros.remove(email, registro);
    }

    @Override
    public boolean registrarFalha(String email) {
        Instant agora = clock.instant();
        if (registros.size() > LIMITE_REGISTROS) {
            registros.values().removeIf(registro -> registro.vencido(agora));
        }
        Registro atualizado = registros.compute(email, (chave, atual) -> {
            int falhas = atual == null || atual.vencido(agora) ? 1 : atual.falhas() + 1;
            Instant bloqueadoAte = falhas >= MAXIMO_FALHAS ? agora.plus(DURACAO_BLOQUEIO) : null;
            return new Registro(falhas, agora, bloqueadoAte);
        });
        return atualizado.bloqueadoAte() != null;
    }

    @Override
    public void registrarSucesso(String email) {
        registros.remove(email);
    }

    private record Registro(int falhas, Instant ultimaFalha, Instant bloqueadoAte) {

        boolean vencido(Instant agora) {
            if (bloqueadoAte != null) {
                return !agora.isBefore(bloqueadoAte);
            }
            return !agora.isBefore(ultimaFalha.plus(JANELA_FALHAS));
        }
    }
}
