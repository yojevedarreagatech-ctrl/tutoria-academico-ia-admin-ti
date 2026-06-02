#!/usr/bin/env sh

set -eu

PROJECT_DIR="${PROJECT_DIR:-/srv/tutoria-academico}"
BACKUP_DIR="${PROJECT_DIR}/backups"

cd "$PROJECT_DIR"

echo "Ultimos backups de base de datos:"
find "${BACKUP_DIR}/db" -maxdepth 1 -type f -name "tutoria_db_*.sql" 2>/dev/null | sort | tail -n 7 || true

echo ""
echo "Ultimos backups de media:"
find "${BACKUP_DIR}/media" -maxdepth 1 -type f -name "tutoria_media_*.tar.gz" 2>/dev/null | sort | tail -n 7 || true

echo ""
echo "Espacio en disco:"
df -h

echo ""
echo "Tamano de backups:"
du -sh "$BACKUP_DIR" 2>/dev/null || echo "No existe carpeta de backups todavia."
