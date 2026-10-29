# Backup e restauração do PostgreSQL

O backup de boot volume da OCI protege contra perda da VM, mas não garante um banco transacionalmente
consistente nem permite restaurar uma tabela só. Por isso existe também um backup **lógico** diário
(`pg_dump`), feito por [`scripts/backup-postgres.sh`](../scripts/backup-postgres.sh) (#231, ameaça
A18, recomendação R07).

## Como funciona

- Roda `pg_dump` dentro do container `db` via `docker compose exec`, a partir de
  `/opt/gestao-refeitorio`. O nome do container e do banco não ficam fixos no script: usuário e
  banco são os `POSTGRES_USER`/`POSTGRES_DB` do próprio container, que vêm do `.env`. Nenhuma
  senha passa pelo script.
- Salva `gestao-refeitorio-AAAAMMDD-HHMMSS.sql.gz` (SQL puro compactado) em
  `/var/backups/gestao-refeitorio`, com permissão só para o dono.
- O arquivo só é mantido se o gzip estiver íntegro e o dump tiver a marca de fim do `pg_dump`. Um
  dump interrompido nunca fica como backup válido.
- Depois de um backup bem-sucedido, apaga os dumps com mais de 7 dias. Se o backup falhar, nada é
  apagado.
- Se `BACKUP_OCI_BUCKET` estiver definida, envia o dump para esse bucket do OCI Object Storage.

| Variável | Padrão | Uso |
|---|---|---|
| `BACKUP_DIR` | `/var/backups/gestao-refeitorio` | Onde os dumps ficam na VM |
| `BACKUP_RETENCAO_DIAS` | `7` | Quantos dias de dumps manter localmente |
| `BACKUP_OCI_BUCKET` | vazio (desligado) | Bucket de destino no OCI Object Storage |
| `APP_DIR` | `/opt/gestao-refeitorio` | Pasta com os arquivos compose (trocar só em teste local) |
| `COMPOSE_OVERLAY` | `docker-compose.prod.yml` | Overlay do compose (trocar só em teste local) |

## Instalação na VM

O deploy copia o script para `/opt/gestao-refeitorio/backup-postgres.sh` junto com os arquivos
compose. Antes da primeira release que inclui o script, copie-o uma vez manualmente (a partir de um
checkout com final de linha LF; o `.gitattributes` garante isso).

1. Teste uma execução manual com o usuário que roda o deploy (precisa ter acesso ao Docker):
   ```bash
   sudo install -d -o "$USER" -m 700 /var/backups/gestao-refeitorio
   bash /opt/gestao-refeitorio/backup-postgres.sh
   ls -lh /var/backups/gestao-refeitorio
   ```
2. Agende o cron diário. Confira o fuso da VM com `timedatectl`: em UTC, `30 6 * * *` corresponde a
   03:30 no horário de Recife (UTC-3). Crie `/etc/cron.d/gestao-refeitorio-backup`, trocando
   `<usuario>`:
   ```cron
   SHELL=/bin/bash
   # BACKUP_OCI_BUCKET=gestao-refeitorio-backups
   30 6 * * * <usuario> bash /opt/gestao-refeitorio/backup-postgres.sh >> /var/log/gestao-refeitorio-backup.log 2>&1
   ```
   Crie o log com dono correto: `sudo install -o <usuario> -m 600 /dev/null /var/log/gestao-refeitorio-backup.log`.

### Envio para o OCI Object Storage (opcional)

1. Crie um bucket **privado** (ex.: `gestao-refeitorio-backups`) e uma lifecycle policy que apague
   objetos com mais de 30 dias. A retenção no bucket é feita pelo OCI, não pelo script.
2. Instale o OCI CLI na VM e autentique com uma credencial que só consiga gravar nesse bucket
   (instance principal ou API key de um usuário técnico).
3. Descomente `BACKUP_OCI_BUCKET` no arquivo do cron.

Sem a variável, o script faz só o backup local. Com ela definida e o OCI CLI ausente, a execução falha
e aparece no log.

## Restauração

Os comandos abaixo rodam em `/opt/gestao-refeitorio`. Defina antes:

```bash
cd /opt/gestao-refeitorio
compose() { docker compose -f docker-compose.yml -f docker-compose.prod.yml "$@"; }
BACKUP=/var/backups/gestao-refeitorio/gestao-refeitorio-AAAAMMDD-HHMMSS.sql.gz
```

### Testar um backup sem tocar no banco real

Restaura num banco separado (`restore_teste`) dentro do mesmo container, confere e apaga:

```bash
compose exec -T db sh -c 'createdb -U "$POSTGRES_USER" restore_teste'
gunzip -c "$BACKUP" | compose exec -T db sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d restore_teste'
compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d restore_teste -c "SELECT count(*) FROM movimentacoes"'
compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" restore_teste'
```

### Restauração completa (substitui o banco atual)

Isso apaga os dados atuais. Antes de começar, faça um backup do estado atual com o próprio script.

```bash
bash backup-postgres.sh
compose stop backend
compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" --force "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
gunzip -c "$BACKUP" | compose exec -T db sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
compose start backend
curl --fail http://127.0.0.1:8080/actuator/health
```

Ao subir, o Flyway confere o histórico de migrations restaurado. Se o backup for de uma versão mais
antiga do schema, as migrations que faltam são aplicadas.

### Restaurar uma tabela só

Restaure o backup em `restore_teste` (como no teste acima) e copie a tabela de lá para o banco real.
Exemplo com `produtos`, substituindo o conteúdo atual da tabela:

```bash
compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d restore_teste --data-only -t produtos' > produtos.sql
compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "TRUNCATE produtos CASCADE"'
compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < produtos.sql
compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" restore_teste'
rm produtos.sql
```

O `TRUNCATE ... CASCADE` também esvazia as tabelas que referenciam essa (por exemplo,
`movimentacoes` referencia `produtos`). Avalie o impacto antes e restaure essas tabelas juntas,
se for o caso.
