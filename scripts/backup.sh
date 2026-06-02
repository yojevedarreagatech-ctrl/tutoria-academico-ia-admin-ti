#!/usr/bin/env sh

set -eu

PROJECT_DIR="${PROJECT_DIR:-/srv/tutoria-academico}"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="${PROJECT_DIR}/backups"
DB_BACKUP_DIR="${BACKUP_DIR}/db"
MEDIA_BACKUP_DIR="${BACKUP_DIR}/media"
PROJECT_SLUG="${PROJECT_SLUG:-$(basename "$PROJECT_DIR")}"
MEDIA_VOLUME="${MEDIA_VOLUME:-${PROJECT_SLUG}_media_data}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DB_BACKUP_FILE="${DB_BACKUP_DIR}/tutoria_db_${TIMESTAMP}.sql"
MEDIA_BACKUP_FILE="${MEDIA_BACKUP_DIR}/tutoria_media_${TIMESTAMP}.tar.gz"
RETENTION_COUNT="${RETENTION_COUNT:-7}"

echo "Backup manual de TutorIA Academico"

cd "$PROJECT_DIR"

if [ ! -f ".env" ]; then
  echo "Error: no existe .env en ${PROJECT_DIR}."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: no existe ${COMPOSE_FILE} en ${PROJECT_DIR}."
  exit 1
fi

# Carga variables no sensibles de entorno para usar POSTGRES_DB y POSTGRES_USER.
set -a
. ./.env
set +a

mkdir -p "$DB_BACKUP_DIR" "$MEDIA_BACKUP_DIR"

echo "Creando backup de base de datos en ${DB_BACKUP_FILE}..."
docker-compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$DB_BACKUP_FILE"

echo "Creando backup de media en ${MEDIA_BACKUP_FILE}..."
docker run --rm \
  -v "${MEDIA_VOLUME}:/source:ro" \
  -v "${MEDIA_BACKUP_DIR}:/backup" \
  alpine:3.20 \
  sh -c "tar -czf /backup/$(basename "$MEDIA_BACKUP_FILE") -C /source ."

prune_backups() {
  target_dir="$1"
  pattern="$2"

  old_files="$(find "$target_dir" -maxdepth 1 -type f -name "$pattern" | sort | head -n -"${RETENTION_COUNT}" 2>/dev/null || true)"
  if [ -n "$old_files" ]; then
    echo "$old_files" | while IFS= read -r file_path; do
      [ -n "$file_path" ] && rm -f "$file_path"
    done
  fi
}

echo "Aplicando retencion: ultimos ${RETENTION_COUNT} backups."
prune_backups "$DB_BACKUP_DIR" "tutoria_db_*.sql"
prune_backups "$MEDIA_BACKUP_DIR" "tutoria_media_*.tar.gz"

echo "Backup finalizado."
echo "DB: ${DB_BACKUP_FILE}"
echo "Media: ${MEDIA_BACKUP_FILE}"
echo "Volume media usado: ${MEDIA_VOLUME}"
