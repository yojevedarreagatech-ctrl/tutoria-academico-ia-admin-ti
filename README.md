# tutoria-academico-ia-admin-ti

Base inicial del proyecto `tutoria-academico-ia-admin-ti`, pensado para crecer por sprints como una plataforma web de tutoria academica con componentes de IA y una ruta clara de despliegue e infraestructura.

## Cursos que cubre

1. Inteligencia Artificial
2. Administracion de TI

## Objetivo general

Construir una aplicacion web de tutoria academica preparada para integrar, en sprints posteriores, capacidades como LLM, RAG, embeddings, vector store, salidas estructuradas, tool calling, workflows agentic, STT y persistencia, sin adelantar esa logica en Sprint 0.

## Estado actual

Sprint 2 deja operativo un frontend base en Next.js con App Router, TypeScript y Tailwind CSS, conectado al backend Django REST para consultar el estado de salud del sistema.

## Stack propuesto

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Python + Django + Django REST Framework
- Base de datos futura: PostgreSQL + pgvector
- Infraestructura: Docker + Docker Compose
- CI/CD futuro: GitHub Actions
- IaC futuro: Terraform
- Despliegue futuro: VPS Linux en `/srv/tutoria-academico` usando el puerto `8088`

## Arquitectura inicial

```text
Frontend (Next.js)
  |
  v
Backend API (Django REST Framework)
  |
  v
PostgreSQL + pgvector

Infra complementaria futura:
- Nginx como reverse proxy
- Docker Compose para entorno local y VPS
- GitHub Actions para validaciones y despliegue
- Terraform para documentar y automatizar infraestructura
```

## Estructura base

```text
tutoria-academico-ia-admin-ti/
  backend/
  frontend/
  infra/
    nginx/
  terraform/
  scripts/
  docs/
  .github/
    workflows/
  docker-compose.yml
  .env.example
  .gitignore
  README.md
```

## Flujo de trabajo previsto

1. Desarrollo local con `frontend`, `backend` y `db` mediante Docker Compose.
2. Versionado y colaboracion desde Git/GitHub.
3. Validaciones basicas con GitHub Actions.
4. Despliegue posterior a VPS Linux en `/srv/tutoria-academico`.
5. Evolucion gradual hacia automatizacion con Terraform, CI/CD y backups.

## Backend Sprint 1

El backend incluye:

- Proyecto Django con configuracion modular en `backend/config/`
- Apps base: `accounts`, `materials`, `chat`, `quizzes`, `ai_core`
- API REST con Django REST Framework
- PostgreSQL como base de datos
- CORS basico para desarrollo local
- Endpoint de salud en `/api/health/`
- Endpoints REST base para materiales, conversaciones, mensajes y quizzes

## Frontend Sprint 2

El frontend incluye:

- Next.js con App Router y TypeScript
- Tailwind CSS para layout y componentes base
- Dashboard conectado a `GET /api/health/`
- Navegacion a `Dashboard`, `Materiales`, `Chat Tutor`, `Quizzes` y `Admin Tecnico`
- Vistas placeholder listas para integracion posterior con endpoints reales

## Sprint 3: documentos

Este sprint agrega carga y procesamiento basico de documentos:

- Formatos soportados: `PDF` y `TXT`
- Upload desde la UI en `/materiales`
- Extraccion de texto en backend
- Division del contenido en chunks
- Persistencia de chunks en PostgreSQL

## Sprint 4: embeddings y busqueda semantica

Este sprint agrega:

- `pgvector` sobre PostgreSQL
- Embeddings para `DocumentChunk`
- Generacion de embeddings usando `OPENAI_API_KEY`
- Busqueda semantica sobre chunks almacenados

Notas:

- Aun no se implementa chat RAG completo.
- Si `OPENAI_API_KEY` no esta configurada, los documentos siguen procesandose, pero sin embeddings.

## Sprint 5: chat tutor con RAG

Este sprint agrega:

- Chat tutor conectado a retrieval
- Generacion de respuestas con LLM usando contexto recuperado
- Persistencia de conversaciones y mensajes
- Fuentes consultadas por respuesta

## Comandos para desarrollo local

```bash
cp .env.example .env
docker compose up --build
docker compose exec backend python manage.py migrate
docker compose logs -f backend
```

Prueba basica esperada:

```bash
GET http://localhost:8000/api/health/
```

## Levantar frontend con npm local

```bash
cd frontend
npm install
npm run dev
```

Frontend esperado:

```bash
http://localhost:3000
```

## Levantar frontend con Docker Compose

```bash
docker compose up --build
```

URLs esperadas:

```bash
Frontend: http://localhost:3000
Backend: http://localhost:8000/api/health/
```

## Probar carga de documentos

1. Levanta el proyecto con `docker compose up --build`.
2. Ejecuta migraciones con `docker compose exec backend python manage.py migrate`.
3. Abre `http://localhost:3000/materiales`.
4. Sube un archivo `.txt` o `.pdf`.
5. Verifica que el material aparezca con estado `processed` y con cantidad de chunks mayor que cero.

## Probar busqueda semantica

1. Verifica que `OPENAI_API_KEY` tenga un valor valido en `.env`.
2. Levanta el proyecto y corre migraciones.
3. Sube un material PDF o TXT.
4. Si el material no tiene embeddings, usa el boton `Generar embeddings`.
5. Abre `http://localhost:3000/admin-tecnico`.
6. Ejecuta una busqueda semantica y revisa los chunks devueltos.

## Probar chat RAG

1. Verifica que `OPENAI_API_KEY` tenga un valor valido en `.env`.
2. Asegura que exista al menos un documento procesado con embeddings.
3. Abre `http://localhost:3000/chat`.
4. Escribe una pregunta relacionada con el contenido cargado.
5. Revisa la respuesta del tutor y las fuentes consultadas.

## Seguridad

- No subir `.env` reales al repositorio.
- No guardar secretos productivos, llaves privadas ni credenciales reales en Git.
- Usar `.env.example` solo como plantilla de variables.

## Documentacion inicial

- [Arquitectura](docs/arquitectura.md)
- [Decisiones tecnicas](docs/decisiones-tecnicas.md)
- [Despliegue VPS](docs/despliegue-vps.md)
- [Backup y continuidad](docs/backup-continuidad.md)

Desde el admin o desde la API ya queda preparada la creacion de `Material`, `Conversation`, `Message`, `Quiz` y `QuizQuestion`, mientras el frontend base permite defender el flujo completo de navegacion e integracion inicial.
