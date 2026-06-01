#!/usr/bin/env sh

set -eu

echo "Docker version:"
docker --version

echo ""
echo "Docker Compose version:"
docker compose version

echo ""
echo "Espacio en disco:"
df -h

echo ""
echo "Puertos escuchando:"
ss -tulpn || netstat -tulpn

echo ""
echo "Contenedores activos:"
docker ps

echo ""
echo "Validando si el puerto 8088 esta ocupado:"
if ss -tulpn 2>/dev/null | grep -q ":8088 "; then
  echo "El puerto 8088 ya esta en uso."
else
  echo "El puerto 8088 esta libre."
fi
