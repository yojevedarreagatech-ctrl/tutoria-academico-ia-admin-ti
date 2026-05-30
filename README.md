# tutoria-academico-ia-admin-ti

Base inicial del proyecto `tutoria-academico-ia-admin-ti`, pensado para crecer por sprints como una plataforma web de tutoria academica con componentes de IA y una ruta clara de despliegue e infraestructura.

## Cursos que cubre

1. Inteligencia Artificial
2. Administracion de TI

## Objetivo general

Construir una aplicacion web de tutoria academica preparada para integrar, en sprints posteriores, capacidades como LLM, RAG, embeddings, vector store, salidas estructuradas, tool calling, workflows agentic, STT y persistencia, sin adelantar esa logica en Sprint 0.

## Alcance de Sprint 0

En este sprint solo se prepara una base ordenada, documentada y segura para desarrollo local y despliegue futuro. No se implementa todavia logica avanzada de IA, quizzes, autenticacion compleja ni flujos productivos completos.

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

## Comandos previstos para desarrollo local

Todavia son comandos base de preparacion. Se iran refinando cuando existan las apps reales.

```bash
cp .env.example .env
docker compose up --build
docker compose down
docker compose logs -f
```

Comandos esperados para siguientes sprints:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py runserver 0.0.0.0:8000
docker compose exec frontend npm run dev
```

## Seguridad

- No subir `.env` reales al repositorio.
- No guardar secretos productivos, llaves privadas ni credenciales reales en Git.
- Usar `.env.example` solo como plantilla de variables.

## Documentacion inicial

- [Arquitectura](docs/arquitectura.md)
- [Decisiones tecnicas](docs/decisiones-tecnicas.md)
- [Despliegue VPS](docs/despliegue-vps.md)
- [Backup y continuidad](docs/backup-continuidad.md)

## Estado actual

Sprint 0 deja la base preparada para iniciar Sprint 1 con el backend base en Django REST, manteniendo el repositorio simple, limpio y listo para crecer.
