package br.ifpe.gestaorefeitorio.model.enums;

/** Perfis de acesso do sistema. */
public enum Perfil {
    ADMIN, // perfil técnico (TI/dev), gerencia usuários e configurações
    NUTRICIONISTA, // planeja cardápio, acompanha estoque e relatórios
    COZINHA // registra entradas/saídas de forma simplificada
}
