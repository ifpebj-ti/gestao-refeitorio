package br.ifpe.gestaorefeitorio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GestaoRefeitorioApplication {

    public static void main(String[] args) {
        SpringApplication.run(GestaoRefeitorioApplication.class, args);
    }
}
