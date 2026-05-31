# Arquitectura inicial

## Objetivo

Definir una vista simple de la arquitectura objetivo sin implementar aun los modulos avanzados del producto.

## Vista de alto nivel

```text
Usuario
  |
  v
Frontend web (Next.js)
  |
  v
API backend (Django REST Framework)
  |
  v
PostgreSQL + pgvector
```

## Flujo de documentos en Sprint 3

```text
Upload desde frontend
  |
  v
POST /api/materials/upload/
  |
  v
Guardado de archivo en MEDIA_ROOT
  |
  v
Extraccion de texto (TXT/PDF)
  |
  v
Chunking sincronico
  |
  v
Persistencia de Material + DocumentChunk en PostgreSQL
```

## Componentes previstos por evolucion

- `frontend/`: interfaz web del tutor academico.
- `backend/`: API, logica de negocio y persistencia.
- `infra/nginx/`: configuracion futura de reverse proxy para VPS.
- `terraform/`: base de IaC y variables de infraestructura.
- `scripts/`: utilidades seguras de despliegue, backup y restauracion.
- `.github/workflows/`: automatizaciones y validaciones de CI/CD.

## Alcance de Sprint 0

- Estructura del repositorio.
- Plantillas de configuracion.
- Documentacion inicial.
- Contenedores base sin logica de aplicacion.

## Evolucion esperada

- Sprint 1: backend base con Django REST.
- Sprint 2: frontend base y conexion con API.
- Sprint 3: carga de documentos, extraccion y chunking.
- Siguientes sprints: integracion progresiva de IA, RAG, almacenamiento vectorial, despliegue y continuidad operativa.
