# Despliegue VPS

## Objetivo

Documentar desde Sprint 0 la forma prevista de despliegue, sin automatizar aun cambios reales sobre una VPS existente.

## Supuestos iniciales

- Sistema operativo objetivo: Linux.
- Ruta del proyecto: `/srv/tutoria-academico`.
- Puerto de exposicion de la aplicacion: `8088`.
- Ejecucion prevista mediante Docker Compose.
- Reverse proxy futuro con Nginx.

## Flujo previsto

1. Desarrollar y validar en local.
2. Subir cambios a GitHub.
3. Ejecutar validaciones basicas en GitHub Actions.
4. En sprint posterior, desplegar en VPS con script controlado o pipeline.
5. Verificar salud basica del stack y persistencia.

## Sprint 9: compose de produccion

Archivos relevantes:

- `docker-compose.prod.yml`
- `infra/nginx/nginx.conf`
- `.env`

## Flujo sugerido en VPS

1. Clonar o actualizar el repositorio en `/srv/tutoria-academico`.
2. Copiar `.env.example` a `.env` y completar valores reales.
3. Verificar `DJANGO_ALLOWED_HOSTS`, `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_WS_URL`.
4. Levantar servicios:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

5. Revisar migraciones y logs:

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx
```

6. Verificar salud basica:

```bash
curl http://localhost:8088/api/health/
```

## Persistencia prevista

- `postgres_data`: base de datos PostgreSQL + pgvector
- `media_data`: documentos y audios cargados
- `backups_data`: carpeta reservada para backups

## Verificaciones clave

- `http://IP_DEL_VPS:8088` carga frontend
- `http://IP_DEL_VPS:8088/api/health/` responde
- `/ws/` queda proxificado para el voice agent
- PostgreSQL no se expone publicamente

## Pendientes para Sprint 10

- hardening basico del servidor
- estrategia de backups automatizados
- pipeline CI/CD hacia VPS
