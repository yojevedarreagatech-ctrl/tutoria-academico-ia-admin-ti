# Backup y continuidad

## Objetivo

Implementar una estrategia basica y segura de backup y recuperacion para `TutorIA Academico` en la VPS.

## Componentes criticos

Se respaldan estos componentes:

- base de datos PostgreSQL
- chunks, embeddings, quizzes y conversaciones dentro de la base
- archivos de `media` como documentos y audios

Se respalda manualmente fuera del repo:

- archivo `.env`

Ya esta respaldado por GitHub:

- codigo fuente

## Que se respalda automaticamente

Con `scripts/backup.sh`:

- dump SQL de PostgreSQL usando `docker-compose`
- archivo comprimido de `media`
- acceso al volumen `media_data` mediante un contenedor auxiliar de solo lectura

## Que se respalda manualmente

- `.env`
- cualquier nota operativa o credencial fuera del repositorio

## Ubicacion de backups

Ruta base:

```bash
/srv/tutoria-academico/backups
```

Subcarpetas:

- `backups/db`
- `backups/media`

## Comandos operativos

Backup manual:

```bash
bash scripts/backup.sh
```

Restaurar base de datos:

```bash
bash scripts/restore_db.sh backups/db/archivo.sql
```

Restaurar media:

```bash
bash scripts/restore_media.sh backups/media/archivo.tar.gz
```

Revisar backups:

```bash
bash scripts/check-backup.sh
```

## Politica de retencion

- se conservan los ultimos 7 backups de base de datos
- se conservan los ultimos 7 backups de media

## Riesgos

- restaurar DB puede sobrescribir o cambiar datos existentes
- restaurar media puede sobrescribir archivos
- guardar backups solo dentro del mismo VPS no protege contra falla total del servidor

## Recomendaciones

- ejecutar backup antes de cambios grandes
- revisar periodicamente espacio en disco
- copiar backups importantes fuera del VPS
- probar restauracion en un entorno controlado cuando sea posible

## Estrategia de continuidad operativa

1. Restaurar el repositorio desde GitHub.
2. Crear `.env` manualmente.
3. Levantar Docker Compose.
4. Restaurar base de datos.
5. Restaurar media.
6. Verificar healthcheck.

## Healthcheck posterior

```bash
curl -f http://127.0.0.1:8088/api/health/
```

## Cron sugerido

Ejemplo documentado, no activado automaticamente:

```bash
crontab -e
```

```bash
0 2 * * * cd /srv/tutoria-academico && bash scripts/backup.sh >> backups/backup.log 2>&1
```

## Nota de seguridad

- no subir backups al repositorio
- no subir `.env`
- para produccion real, se recomienda copiar backups fuera del VPS
