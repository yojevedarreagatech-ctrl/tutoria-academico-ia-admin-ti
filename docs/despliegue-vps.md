# Despliegue VPS

## Objetivo

Preparar un despliegue manual, aislado y no destructivo para `TutorIA Academico` dentro de una VPS existente, sin tocar la aplicacion `LIS Los Encinos`.

## Supuestos iniciales

- Sistema operativo objetivo: Linux.
- Ruta del proyecto: `/srv/tutoria-academico`.
- Puerto de exposicion de la aplicacion: `8088`.
- Ejecucion prevista mediante Docker Compose.
- Reverse proxy interno con Nginx.
- La aplicacion LIS existente no se modifica ni comparte compose con este proyecto.

## Archivos relevantes

- `docker-compose.prod.yml`
- `infra/nginx/nginx.conf`
- `scripts/deploy.sh`
- `scripts/check-vps.sh`
- `.env`

## Guia paso a paso

### A. Preparacion local

1. Confirma que tu rama principal este actualizada.
2. Haz `push` del estado final del proyecto a GitHub.

### B. Acceso al VPS

```bash
ssh usuario@IP_DEL_VPS
```

### C. Crear carpeta aislada

```bash
sudo mkdir -p /srv/tutoria-academico
sudo chown -R $USER:$USER /srv/tutoria-academico
```

### D. Clonar repositorio

```bash
cd /srv
git clone URL_DEL_REPO tutoria-academico
cd /srv/tutoria-academico
```

### E. Crear archivo .env

```bash
cp .env.example .env
nano .env
```

### F. Variables importantes de produccion

- `ENVIRONMENT=production`
- `DEBUG=False`
- `DJANGO_ALLOWED_HOSTS=IP_DEL_VPS,localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGINS=http://IP_DEL_VPS:8088,http://localhost:8088`
- `CSRF_TRUSTED_ORIGINS=http://IP_DEL_VPS:8088,http://localhost:8088`
- `NEXT_PUBLIC_API_URL=http://IP_DEL_VPS:8088/api`
- `NEXT_PUBLIC_WS_URL=ws://IP_DEL_VPS:8088/ws`
- `POSTGRES_HOST=db`
- `OPENAI_API_KEY`
- `ASSEMBLYAI_API_KEY`
- `CARTESIA_API_KEY`

Importante:

- No subir `.env` al repositorio.
- No copiar claves reales a documentación ni scripts.

### G. Levantar contenedores

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### H. Ejecutar migraciones

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
```

### I. Verificar contenedores y logs

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f nginx
```

### J. Probar en navegador

```text
http://IP_DEL_VPS:8088
```

### K. Pruebas minimas

- `http://IP_DEL_VPS:8088/api/health/`
- abrir frontend
- subir documento pequeno
- generar embeddings
- chat textual
- quiz
- voice agent, solo si el navegador permite microfono desde la IP

## Persistencia prevista

- `postgres_data`: base de datos PostgreSQL + pgvector
- `media_data`: documentos y audios cargados
- `backups_data`: carpeta reservada para backups

## Nota sobre microfono y HTTP

- En local, `localhost` normalmente permite acceso al microfono.
- En VPS por IP y `HTTP`, algunos navegadores pueden bloquear `getUserMedia`.
- Para demo del voice agent en VPS puede hacer falta `HTTPS` o permisos especiales del navegador.
- Si el microfono falla por esa razon, el voice agent se puede demostrar localmente y el resto del sistema en la VPS.

## Verificaciones clave

- `http://IP_DEL_VPS:8088` carga frontend
- `http://IP_DEL_VPS:8088/api/health/` responde
- `/ws/` queda proxificado para el voice agent
- PostgreSQL no se expone publicamente

## Aislamiento respecto al LIS

- Este proyecto vive en `/srv/tutoria-academico`
- Usa su propio `docker-compose.prod.yml`
- Usa su propio puerto `8088`
- No requiere modificar carpetas ni compose del LIS existente
