# Despliegue VPS

## Objetivo

Preparar un despliegue manual, aislado y no destructivo para `TutorIA Academico` dentro de una VPS existente, sin tocar la aplicacion `LIS Los Encinos`.

## Supuestos iniciales

- Sistema operativo objetivo: Linux.
- Ruta del proyecto: `/srv/tutoria-academico`.
- Puerto de exposicion de la aplicacion: `8088`.
- Ejecucion prevista mediante `docker-compose` v1.
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
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.prod.yml up -d --build
```

### H. Ejecutar migraciones

```bash
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
```

### I. Verificar contenedores y logs

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### J. Probar en navegador

```text
http://IP_DEL_VPS:8088
```

### K. Pruebas minimas

- `http://IP_DEL_VPS:8088/api/health/`
- abrir frontend
- subir documento pequeno
- verificar embeddings generados
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

## CI/CD con GitHub Actions

### Secrets requeridos en GitHub

Configura estos secrets en el repositorio:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `PROJECT_PATH`

Valor esperado:

- `PROJECT_PATH=/srv/tutoria-academico`

Importante:

- no guardar llaves SSH en el repositorio
- no subir `.env` ni credenciales reales
- el deploy usa el repo ya clonado en la VPS

### Flujo automatico

Cuando haces `push` a `main`, GitHub Actions:

1. Ejecuta la validacion de backend y frontend.
2. Se conecta por SSH a la VPS.
3. Entra a `$PROJECT_PATH`.
4. Verifica que exista `.env`.
5. Ejecuta `git fetch` y `git pull --ff-only`.
6. Ejecuta `docker-compose -f docker-compose.prod.yml down --remove-orphans`.
7. Ejecuta `docker-compose -f docker-compose.prod.yml up -d --build`.
8. Ejecuta migraciones.
9. Muestra `docker-compose -f docker-compose.prod.yml ps`.
10. Ejecuta un healthcheck final.

Notas importantes:

- el VPS usa `docker-compose` v1
- no se usa `docker compose`
- la recreacion es controlada y no elimina volumenes
- no se usa `down -v`
- no se tocan contenedores fuera del proyecto

## Relacion con Terraform

Terraform documenta de forma no destructiva:

- `project_path`
- dominio publico
- puerto interno
- `backup_path`
- archivo `docker-compose.prod.yml`
- estrategia actual de despliegue

Importante:

- Terraform no despliega la app
- Terraform no modifica la VPS real
- el despliegue operativo sigue haciendose con Docker Compose y GitHub Actions

### Como verificar Actions

1. Abre la pestana `Actions` en GitHub.
2. Revisa la ejecucion de `CI`.
3. Revisa la ejecucion de `Deploy`.
4. Confirma que ambas terminen en estado exitoso.

### Como revisar logs si falla

En GitHub:

- abre la corrida fallida
- revisa el paso exacto que fallo

En la VPS:

```bash
cd /srv/tutoria-academico
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Rollback manual simple

Si una version falla y necesitas volver rapidamente:

```bash
cd /srv/tutoria-academico
git log --oneline
git checkout <commit_anterior>
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
```

Luego verifica:

- `docker-compose -f docker-compose.prod.yml ps`
- `curl -f http://127.0.0.1:8088/api/health/`
