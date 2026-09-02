package br.ifpe.estoquecozinha;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EstoqueCozinhaApplication {

    public static void main(String[] args) {
        SpringApplication.run(EstoqueCozinhaApplication.class, args);
    }
}
