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

## Pendientes para siguientes sprints

- Archivo real de Compose para produccion.
- Configuracion de Nginx.
- Estrategia de secrets y variables por entorno.
- Hardening basico del servidor.
- Automatizacion parcial o total del despliegue.
