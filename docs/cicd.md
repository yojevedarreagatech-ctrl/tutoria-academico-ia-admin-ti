# CI/CD

## Que es CI

CI significa `Continuous Integration`.

En este proyecto, CI valida automaticamente el codigo cada vez que hay:

- `push` a `main`
- `pull_request` hacia `main`

La validacion actual revisa:

- backend Django
- frontend Next.js

## Que es CD

CD significa `Continuous Deployment`.

En este proyecto, CD toma el codigo ya enviado a `main` y lo despliega automaticamente en la VPS por SSH.

## Que valida el pipeline

### Backend

- instala Python
- instala dependencias desde `backend/requirements.txt`
- valida sintaxis con `python -m compileall`
- ejecuta `python manage.py check`

Notas:

- no usa secretos reales
- usa variables dummy para el chequeo
- no requiere conectar una base de datos real para esta validacion basica

### Frontend

- instala Node.js
- instala dependencias con `npm ci`
- ejecuta `npm run build`

Variables dummy usadas en CI:

- `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
- `NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws`

## Como despliega

El workflow `deploy.yml`:

1. Se ejecuta en `push` a `main`.
2. Usa GitHub Secrets para conectarse por SSH al VPS.
3. Entra a `PROJECT_PATH`.
4. Verifica que exista `.env`.
5. Hace `git fetch origin main`.
6. Hace `git pull --ff-only origin main`.
7. Ejecuta:

```bash
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
docker-compose -f docker-compose.prod.yml ps
```

8. Ejecuta un healthcheck final:

```bash
curl -f http://127.0.0.1:8088/api/health/ || curl -f https://tutoria.centromedicolosencinos.tech/api/health/
```

## Secrets usados

Los secrets necesarios en GitHub son:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `PROJECT_PATH`

Importante:

- no se guardan secretos en el repositorio
- no se guarda `.env` en Git
- la llave SSH vive solo en GitHub Secrets
- el VPS usa `docker-compose` v1
- GitHub Actions usa `PROJECT_PATH` y `VPS_HOST` como secrets
- Terraform documenta esos mismos valores como variables y outputs no sensibles

## Riesgos y mitigaciones

### Riesgo: deploy destructivo

Mitigacion:

- no se usa `docker-compose down -v`
- `docker-compose down --remove-orphans` solo recrea contenedores del proyecto
- no se borran volumenes
- no se usa `docker volume rm`
- el pipeline no borra datos persistentes

### Riesgo: despliegue sobre configuracion incompleta

Mitigacion:

- el workflow verifica que exista `.env` antes de desplegar

### Riesgo: romper produccion por comandos incompatibles

Mitigacion:

- el deploy usa `docker-compose`, que es el comando ya utilizado en la VPS
- no se cambia a `docker compose`

### Recomendacion operativa

Antes de cambios mayores:

- ejecutar `bash scripts/backup.sh`
- confirmar que `bash scripts/check-backup.sh` muestre respaldos recientes

### Riesgo: falla posterior al deploy

Mitigacion:

- se ejecutan migraciones automaticamente
- se imprime el estado con `docker-compose ps`
- se ejecuta healthcheck al final
- existe rollback manual simple por `git checkout`

## Checklist de verificacion

- `CI` pasa en GitHub Actions.
- `Deploy` pasa en GitHub Actions.
- La VPS actualiza los contenedores.
- El healthcheck responde correctamente.
- Un cambio visual pequeno en frontend se refleja despues del `push`.
