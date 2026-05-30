# Backup y continuidad

## Objetivo

Dejar lineamientos iniciales para respaldos y recuperacion, sin ejecutar acciones destructivas ni productivas en Sprint 0.

## Alcance inicial

- Base para respaldar base de datos PostgreSQL.
- Base para respaldar archivos de media si el proyecto los usa.
- Base documental para restauracion controlada.

## Estrategia prevista

- Generar dumps de la base de datos en una ruta dedicada de backups.
- Versionar scripts, no los backups.
- Validar periodicamente que la restauracion sea reproducible.
- Separar backups locales de backups del entorno VPS.

## Pendientes para siguientes sprints

- Definir politica de retencion.
- Automatizar ejecucion con cron o equivalente.
- Agregar compresion, rotacion y logs.
- Definir pruebas regulares de restauracion.
