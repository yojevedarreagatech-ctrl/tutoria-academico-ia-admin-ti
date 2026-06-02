# tutoria-academico-ia-admin-ti

Base inicial del proyecto `tutoria-academico-ia-admin-ti`, pensado para crecer por sprints como una plataforma web de tutoria academica con componentes de IA y una ruta clara de despliegue e infraestructura.

## Cursos que cubre

1. Inteligencia Artificial
2. Administracion de TI

## Objetivo general

Construir una aplicacion web de tutoria academica preparada para integrar, en sprints posteriores, capacidades como LLM, RAG, embeddings, vector store, salidas estructuradas, tool calling, workflows agentic, STT y persistencia, sin adelantar esa logica en Sprint 0.

## Estado actual

El proyecto ya cubre la base full stack con:

- backend Django REST + PostgreSQL
- frontend Next.js
- carga y procesamiento de documentos y audio
- embeddings + busqueda semantica
- chat RAG con LangGraph
- voice agent conversacional por WebSocket

## Stack propuesto

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Python + Django + Django REST Framework
- Base de datos futura: PostgreSQL + pgvector
- Infraestructura: Docker + Docker Compose
- CI/CD: GitHub Actions
- IaC: Terraform
- Despliegue futuro: VPS Linux en `/srv/tutoria-academico` usando el puerto `8088`

## Sprint 9: Docker Compose completo

Este sprint deja listo:

- `docker-compose.yml` para desarrollo local
- `docker-compose.prod.yml` para VPS
- persistencia de PostgreSQL y media files
- healthchecks para `db` y `backend`
- Nginx interno para exponer la app en `8088` en produccion

## Sprint 11: CI/CD con GitHub Actions

Este sprint agrega:

- validacion automatica de backend y frontend en cada `push` a `main`
- validacion en `pull_request` hacia `main`
- despliegue automatico por SSH hacia la VPS al hacer `push` a `main`
- rebuild no destructivo con `docker-compose -f docker-compose.prod.yml up -d --build`
- migraciones automaticas con `docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate`
- healthcheck posterior al despliegue

## Sprint 12: Infrastructure as Code con Terraform

Este sprint agrega:

- carpeta `terraform/` con variables y outputs operativos
- representacion segura de la VPS existente
- documentacion de ruta, dominio, puerto, backups y estrategia de despliegue
- ejecucion local de `terraform init`, `validate`, `plan` y `output`
- ausencia de providers o recursos reales para no afectar produccion

## Sprint 13: Backup y continuidad operativa

Este sprint agrega:

- backup manual de PostgreSQL con `docker-compose`
- backup manual de `media` con compresion
- scripts seguros de restauracion con confirmacion explicita
- retencion simple de ultimos 7 backups
- documentacion de continuidad operativa y recuperacion

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
- Terraform para documentar la infraestructura actual y preparar automatizacion futura
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
3. Validaciones automaticas con GitHub Actions.
4. Despliegue automatico a VPS Linux en `/srv/tutoria-academico`.
5. Evolucion gradual hacia Terraform, observabilidad y backups.

## Infrastructure as Code con Terraform

La carpeta `terraform/` documenta la infraestructura actual del proyecto sin modificar la VPS real.

Comandos basicos:

```bash
cd terraform
terraform init
terraform validate
terraform plan -var-file="terraform.tfvars.example"
terraform output
```

Notas:

- no contiene secretos
- no usa llaves SSH privadas
- no crea ni destruye recursos reales
- representa la infraestructura operativa del despliegue actual

## Backup y continuidad operativa

Comandos principales:

```bash
bash scripts/backup.sh
bash scripts/check-backup.sh
bash scripts/restore_db.sh backups/db/archivo.sql
```

Notas:

- los backups viven fuera del repo en `backups/`
- `.env` se respalda manualmente fuera de Git
- no se usan comandos destructivos como `docker-compose down -v`
- se recomienda hacer backup antes de cambios mayores

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

## Sprint 6: LangGraph y workflow con tools

Este sprint agrega:

- Workflow del chat implementado con LangGraph
- Estado compartido para el flujo del tutor
- `search_materials_tool` como tool principal de retrieval
- Endpoint de diagnostico en `/api/chat/workflow-info/`

## Sprint 7: audio y voice agent

Este sprint agrega:

- Audio como material de estudio
- STT para transcribir audio cargado
- Reutilizacion del mismo pipeline de chunks y embeddings
- Voice agent por WebSocket
- TTS obligatorio para responder con voz en la demo

## Sprint 7.1: experiencia conversacional

Este ajuste mejora la UX del tutor:

- Chat textual mas conversacional y continuo
- Voice agent con una sola sesion activa
- Deteccion automatica de fin de turno por silencio
- Reanudacion automatica de escucha despues de cada respuesta
- Historial visual de turnos en voz y texto

## Sprint 7.2: alineacion total entre chat y voz

Este ajuste asegura que ambos modos compartan exactamente la misma logica conversacional:

- chat textual: texto -> flujo conversacional comun -> texto
- voice agent: audio -> STT -> flujo conversacional comun -> texto -> TTS
- continuidad por `conversation_id` durante toda la sesion
- respuestas limpias sin mencionar `chunk #`, `chunk_id` ni metadatos internos

## Sprint 7.4: control estricto de turnos en voz

Este ajuste agrega:

- `turn_id` por cada turno del usuario en voice agent
- bloqueo de procesamiento paralelo
- ignorar eventos atrasados en frontend
- `practice_state` explicito para evitar desfase al practicar

## Sprint 7.5: conversation manager compartido

Este ajuste convierte el chat textual y el voice agent en dos interfaces del mismo cerebro conversacional:

- `conversation_manager` central para texto y voz
- deteccion de intencion por reglas simples antes de responder
- `session_state` explicito para practica, continuidad y follow-ups
- retrieval gating con umbrales configurables para evitar alucinaciones
- acciones concretas como resumir, simplificar, dar ejemplo, practicar o rechazar preguntas fuera del material
- respuestas de voz realmente mas cortas y controladas por configuracion

## Sprint 8: mini quizzes con structured output

Este sprint agrega:

- generacion de mini quizzes desde materiales procesados
- structured output en JSON antes de guardar
- validacion de preguntas, opciones, respuesta correcta y explicacion
- persistencia en `Quiz` y `QuizQuestion`
- UI de practica en `/quizzes`

Variables relevantes:

- `STT_PROVIDER`
- `ASSEMBLYAI_API_KEY`
- `ASSEMBLYAI_SPEECH_MODEL`
- `TTS_PROVIDER`
- `CARTESIA_API_KEY`
- `CARTESIA_LANGUAGE`
- `CARTESIA_VOICE_ID`
- `VOICE_AGENT_ENABLED`
- `VOICE_AGENT_MAX_SENTENCES`
- `VOICE_AGENT_MAX_WORDS`
- `VOICE_AGENT_MAX_RESPONSE_SENTENCES`
- `RETRIEVAL_MIN_SCORE`
- `RETRIEVAL_MAX_DISTANCE`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_VOICE_AGENT_SILENCE_MS`

## Comandos para desarrollo local

```bash
cp .env.example .env
docker compose up --build
docker compose exec backend python manage.py migrate
docker compose logs -f backend
```

## Desarrollo local sin Docker

Backend:

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm install
npm run dev
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

## Produccion con Docker Compose

```bash
cp .env.example .env
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
```

Opcional:

```bash
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py createsuperuser
```

URLs esperadas:

```bash
App: http://IP_DEL_VPS:8088
Health: http://IP_DEL_VPS:8088/api/health/
```

## Despliegue manual en VPS

Resumen:

- ruta del proyecto: `/srv/tutoria-academico`
- puerto publico inicial: `8088`
- archivo principal: `docker-compose.prod.yml`
- script sugerido: `scripts/deploy.sh`
- no subir `.env` al repositorio

Flujo corto:

```bash
ssh usuario@IP_DEL_VPS
cd /srv/tutoria-academico
cp .env.example .env
nano .env
./scripts/deploy.sh
```

## CI/CD con GitHub Actions

`push` a `main` dispara:

- `CI`: valida backend y frontend
- `Deploy`: se conecta por SSH al VPS y actualiza el despliegue productivo

`pull_request` hacia `main` dispara:

- `CI`: validacion de backend y frontend antes de merge

Secrets requeridos en GitHub:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `PROJECT_PATH`

Notas del flujo:

- `PROJECT_PATH` debe apuntar a `/srv/tutoria-academico`
- el deploy usa `docker-compose`, no `docker compose`
- el repositorio no guarda `.env`, llaves SSH ni API keys
- Terraform documenta esos mismos valores con variables y outputs no sensibles
- el despliegue hace `git fetch` y `git pull --ff-only`
- luego ejecuta `docker-compose -f docker-compose.prod.yml up -d --build`
- despues corre migraciones y un healthcheck
- no se usan comandos destructivos como `docker-compose down -v`
- se recomienda backup antes de cambios mayores en produccion

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

## Healthchecks utiles

```bash
docker compose ps
docker compose logs -f backend
curl http://localhost:8000/api/health/
```

## Probar chat RAG

1. Verifica que `OPENAI_API_KEY` tenga un valor valido en `.env`.
2. Asegura que exista al menos un documento procesado con embeddings.
3. Abre `http://localhost:3000/chat`.
4. Escribe una pregunta relacionada con el contenido cargado.
5. Revisa la respuesta del tutor y las fuentes consultadas.

## Probar modo practica

1. Abre `http://localhost:3000/chat`.
2. Pide `Hazme una pregunta para practicar`.
3. Responde la pregunta con tus propias palabras.
4. Verifica que el tutor evalue tu respuesta antes de ofrecer otra pregunta.
5. Pide `Otra pregunta` solo si quieres continuar practicando.

## Probar workflow LangGraph

1. Llama `GET http://localhost:8000/api/chat/workflow-info/`.
2. Verifica que el workflow reportado sea `LangGraph`.
3. Verifica que `search_materials_tool` aparezca en la lista de tools.
4. Prueba luego `/chat` normalmente: el frontend sigue usando el mismo endpoint `/api/chat/ask/`.

## Probar audio como material

1. Abre `http://localhost:3000/materiales`.
2. En `Subir audio de estudio`, carga un archivo `mp3`, `wav`, `m4a` o `webm`.
3. Si `STT_PROVIDER=manual`, agrega tambien `transcription_text`.
4. Verifica que se cree la transcripcion, los chunks y los embeddings si `OPENAI_API_KEY` esta configurada.

## Probar voice agent

1. Verifica que el navegador tenga permiso de microfono.
2. Verifica que `ASSEMBLYAI_API_KEY` y `CARTESIA_API_KEY` tengan valores validos.
3. Abre `http://localhost:3000/chat`.
4. Presiona `Iniciar conversacion`.
5. Habla con normalidad y espera una breve pausa al terminar tu turno.
6. Revisa la transcripcion final, la respuesta textual y la reproduccion automatica de audio.
7. Al terminar la voz del tutor, el sistema vuelve a escuchar.

Notas:

- El modo voz reutiliza el mismo workflow RAG del chat textual.
- El modo voz y el chat textual usan el mismo `conversation_manager`.
- El modo voz mantiene el mismo `conversation_id` durante la sesion WebSocket.
- El modo practica reutiliza la misma logica conversacional en chat textual y voz.
- Cada turno de voz usa `turn_id` para mantener el orden correcto de respuestas.
- Si retrieval no encuentra contexto suficientemente relevante, el tutor responde: `No puedo responder eso con la informacion cargada.`
- Primero debe existir material procesado con embeddings.
- Si falta `OPENAI_API_KEY`, `ASSEMBLYAI_API_KEY` o `CARTESIA_API_KEY`, veras un error claro segun el componente que falte.

## Probar quizzes

1. Verifica que `OPENAI_API_KEY` tenga un valor valido.
2. Asegura que exista un material con estado `processed` y con chunks.
3. Abre `http://localhost:3000/quizzes`.
4. Selecciona un material y genera un quiz de 3 o 5 preguntas.
5. Revisa las respuestas y explicaciones.

Structured output esperado:

```json
{
  "title": "Quiz sobre el material",
  "questions": [
    {
      "question": "Texto de la pregunta",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Explicacion breve basada en el material"
    }
  ]
}
```

## Seguridad

- No subir `.env` reales al repositorio.
- No guardar secretos productivos, llaves privadas ni credenciales reales en Git.
- Usar `.env.example` solo como plantilla de variables.

## Documentacion inicial

- [Arquitectura](docs/arquitectura.md)
- [Decisiones tecnicas](docs/decisiones-tecnicas.md)
- [Despliegue VPS](docs/despliegue-vps.md)
- [CI/CD](docs/cicd.md)
- [Terraform](docs/terraform.md)
- [Backup y continuidad](docs/backup-continuidad.md)

Desde el admin o desde la API ya queda preparada la creacion de `Material`, `Conversation`, `Message`, `Quiz` y `QuizQuestion`, mientras el frontend base permite defender el flujo completo de navegacion e integracion inicial.
