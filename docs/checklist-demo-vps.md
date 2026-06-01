# Checklist Demo VPS

## Acceso y carpeta

- [ ] La VPS responde por SSH.
- [ ] El proyecto existe en `/srv/tutoria-academico`.
- [ ] El repositorio esta actualizado en esa carpeta.

## Docker Compose

- [ ] `docker compose -f docker-compose.prod.yml ps` muestra contenedores `up`.
- [ ] Existe evidencia visual o por terminal de `db`, `backend`, `frontend` y `nginx`.
- [ ] `docker compose -f docker-compose.prod.yml logs -f backend` no muestra errores criticos al iniciar.

## App por IP

- [ ] La app abre en `http://IP_DEL_VPS:8088`.
- [ ] `http://IP_DEL_VPS:8088/api/health/` responde correctamente.

## Persistencia

- [ ] PostgreSQL persiste datos entre reinicios.
- [ ] Los archivos cargados persisten en `media_data`.

## Funcionalidades minimas

- [ ] Se puede subir un documento pequeno.
- [ ] Se pueden generar embeddings.
- [ ] El chat textual responde.
- [ ] El quiz funciona.
- [ ] El voice agent fue probado localmente o en VPS segun permisos del navegador.

## Nota sobre microfono

- [ ] Se documento si el navegador bloqueo microfono por usar IP + HTTP.
- [ ] Si aplica, se dejo claro que voz puede demostrarse localmente mientras el resto corre en VPS.
