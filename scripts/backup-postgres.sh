#!/usr/bin/env bash
# Backup lógico diário do PostgreSQL (#231). Instalação, cron e restauração: docs/BACKUP_POSTGRES.md.
set -Eeuo pipefail

readonly app_dir="${APP_DIR:-/opt/gestao-refeitorio}"
readonly overlay="${COMPOSE_OVERLAY:-docker-compose.prod.yml}"
readonly backup_dir="${BACKUP_DIR:-/var/backups/gestao-refeitorio}"
readonly retencao_dias="${BACKUP_RETENCAO_DIAS:-7}"
readonly bucket="${BACKUP_OCI_BUCKET:-}"
readonly prefixo="gestao-refeitorio"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$*"
}

compose() {
  docker compose -f docker-compose.yml -f "$overlay" "$@"
}

trap 'log "Backup falhou (linha ${LINENO})."' ERR

if ! [[ "$retencao_dias" =~ ^[1-9][0-9]*$ ]]; then
  log "BACKUP_RETENCAO_DIAS inválido: ${retencao_dias}"
  exit 1
fi

# O dump contém e-mails de usuários: arquivos e diretório só para o dono.
umask 077
mkdir -p "$backup_dir"

if command -v flock >/dev/null; then
  exec 9>"${backup_dir}/.lock"
  if ! flock -n 9; then
    log "Outro backup ainda está em execução; abortando."
    exit 1
  fi
fi

cd "$app_dir"

readonly arquivo="${backup_dir}/${prefixo}-$(date '+%Y%m%d-%H%M%S').sql.gz"
readonly parcial="${arquivo}.partial"
trap 'rm -f "$parcial"' EXIT

log "Iniciando backup em ${arquivo}"

# Usuário e banco vêm do próprio container (POSTGRES_USER/POSTGRES_DB): nada de senha no script nem no log.
compose exec -T db sh -c 'pg_dump --no-owner --no-privileges -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  | gzip -9 > "$parcial"

# Só vira backup válido se o gzip estiver íntegro e o pg_dump tiver chegado ao fim.
gzip -t "$parcial"
if ! gzip -dc "$parcial" | tail -n 5 | grep -q 'PostgreSQL database dump complete'; then
  log "Dump incompleto: marca de fim do pg_dump não encontrada."
  exit 1
fi

mv "$parcial" "$arquivo"
log "Backup concluído: $(du -h "$arquivo" | cut -f1)"

if [[ -n "$bucket" ]]; then
  if ! command -v oci >/dev/null; then
    log "BACKUP_OCI_BUCKET definido, mas o OCI CLI não está instalado."
    exit 1
  fi
  oci os object put --bucket-name "$bucket" --file "$arquivo" --name "$(basename "$arquivo")" --force >/dev/null
  log "Backup enviado para o bucket ${bucket}"
fi

# Expurgo só depois de um backup novo bem-sucedido, pra falhas seguidas não apagarem o histórico.
# -mtime +N casa arquivos com N+1 dias completos ou mais; N = retenção - 1 mantém os últimos 7 dias.
find "$backup_dir" -maxdepth 1 -name "${prefixo}-*.sql.gz" -mtime +"$((retencao_dias - 1))" -print -delete \
  | while read -r removido; do log "Removido por retenção: ${removido}"; done
