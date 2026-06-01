#!/usr/bin/env sh

set -eu

PROJECT_DIR="/srv/tutoria-academico"
COMPOSE_FILE="docker-compose.prod.yml"

echo "Despliegue manual de TutorIA Academico en VPS"

if [ "$(pwd)" != "$PROJECT_DIR" ]; then
  echo "Aviso: este script esta pensado para ejecutarse dentro de $PROJECT_DIR"
fi

if [ ! -f ".env" ]; then
  echo "Error: no existe .env en el directorio actual."
  echo "Crea el archivo a partir de .env.example antes de desplegar."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: no existe $COMPOSE_FILE en el directorio actual."
  exit 1
fi

echo "Actualizando codigo fuente con git pull..."
git pull

echo "Levantando contenedores de produccion..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "Ejecutando migraciones..."
docker compose -f "$COMPOSE_FILE" exec backend python manage.py migrate

echo "Estado actual de contenedores:"
docker compose -f "$COMPOSE_FILE" ps
