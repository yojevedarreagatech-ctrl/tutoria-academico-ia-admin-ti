#!/usr/bin/env sh

set -eu

PROJECT_DIR="${PROJECT_DIR:-/srv/tutoria-academico}"
COMPOSE_FILE="docker-compose.prod.yml"

if [ "$#" -ne 1 ]; then
  echo "Uso: bash scripts/restore_db.sh backups/db/archivo.sql"
  exit 1
fi

BACKUP_FILE="$1"

cd "$PROJECT_DIR"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: no existe el archivo ${BACKUP_FILE}."
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "Error: no existe .env en ${PROJECT_DIR}."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: no existe ${COMPOSE_FILE} en ${PROJECT_DIR}."
  exit 1
fi

set -a
. ./.env
set +a

echo "Advertencia: restaurar la base de datos puede sobrescribir o cambiar datos existentes."
printf "Escribe RESTORE para continuar: "
read -r confirmation

if [ "$confirmation" != "RESTORE" ]; then
  echo "Restauracion cancelada."
  exit 1
fi

echo "Restaurando base de datos desde ${BACKUP_FILE}..."
cat "$BACKUP_FILE" | docker-compose -f "$COMPOSE_FILE" exec -T db \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB"

echo "Restauracion finalizada."
