package br.ifpe.gestaorefeitorio.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import br.ifpe.gestaorefeitorio.exception.TokenGoogleInvalidoException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Slf4j
@Component
public class GoogleTokenValidator {

    @Value("${google.oauth.client-id}")
    private String clientId;

    private GoogleIdTokenVerifier verifier;

    private GoogleIdTokenVerifier verifier() {
        if (verifier == null) {
            verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();
        }
        return verifier;
    }

    /**
     * Valida o id_token junto ao Google e retorna o payload verificado.
     */
    public GoogleIdToken.Payload validar(String idToken) {
        try {
            GoogleIdToken token = verifier().verify(idToken);
            if (token == null) {
                throw new TokenGoogleInvalidoException();
            }
            return token.getPayload();
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            log.debug("Falha ao validar id_token do Google: {}", e.getMessage());
            throw new TokenGoogleInvalidoException();
        }
    }
}
