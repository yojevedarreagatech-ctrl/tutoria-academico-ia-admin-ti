#!/usr/bin/env sh

set -eu

PROJECT_DIR="${PROJECT_DIR:-/srv/tutoria-academico}"
PROJECT_SLUG="${PROJECT_SLUG:-$(basename "$PROJECT_DIR")}"
MEDIA_VOLUME="${MEDIA_VOLUME:-${PROJECT_SLUG}_media_data}"

if [ "$#" -ne 1 ]; then
  echo "Uso: bash scripts/restore_media.sh backups/media/archivo.tar.gz"
  exit 1
fi

BACKUP_FILE="$1"

cd "$PROJECT_DIR"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: no existe el archivo ${BACKUP_FILE}."
  exit 1
fi

echo "Advertencia: restaurar media puede sobrescribir archivos existentes."
printf "Escribe RESTORE para continuar: "
read -r confirmation

if [ "$confirmation" != "RESTORE" ]; then
  echo "Restauracion cancelada."
  exit 1
fi

echo "Restaurando media desde ${BACKUP_FILE}..."
docker run --rm \
  -v "${MEDIA_VOLUME}:/target" \
  -v "$(dirname "$BACKUP_FILE"):/backup:ro" \
  alpine:3.20 \
  sh -c "tar -xzf /backup/$(basename "$BACKUP_FILE") -C /target"

echo "Restauracion de media finalizada."
echo "Volume media usado: ${MEDIA_VOLUME}"
