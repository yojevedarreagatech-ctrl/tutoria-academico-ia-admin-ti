# TutorIA Académico — Proyecto IA + Administración TI

## Descripción general

TutorIA Académico es una aplicación web de tutoría académica basada en IA. Permite cargar documentos y audios de estudio, procesarlos con una arquitectura RAG, conversar con un tutor por texto o por voz y generar quizzes de práctica a partir del contenido cargado.

El proyecto combina una solución funcional de Inteligencia Artificial con una capa operativa de Administración de TI: despliegue en VPS, Docker Compose, CI/CD, documentación de infraestructura con Terraform y estrategia básica de backup y continuidad.

## Cursos que cubre

Este proyecto integra requisitos y evidencias de dos cursos:

- Inteligencia Artificial
- Administración de Tecnologías de Información

## Problema que resuelve

Muchos estudiantes tienen materiales de estudio dispersos entre PDFs, apuntes de texto, audios de clase y notas personales. Eso dificulta estudiar, repasar y practicar de forma organizada.

TutorIA Académico resuelve ese problema centralizando materiales y permitiendo:

- consultar los propios contenidos con un tutor IA
- repasar conceptos concretos
- practicar con quizzes
- usar interacción textual o por voz

## Objetivo del sistema

### Objetivo general

Construir una plataforma web de tutoría académica apoyada por IA que permita estudiar sobre materiales propios mediante RAG, conversación textual o por voz y generación automática de quizzes.

### Objetivos específicos

- cargar y procesar documentos y audios como material de estudio
- transformar contenido en chunks y embeddings reutilizables
- realizar recuperación semántica con PostgreSQL + pgvector
- responder preguntas usando contexto relevante del material cargado
- permitir una experiencia conversacional por voz con STT y TTS
- generar quizzes estructurados para práctica
- desplegar la solución en una VPS con procesos operativos claros
- documentar CI/CD, IaC y backups como parte del componente de Administración TI

## Funcionalidades principales

- Carga de documentos PDF y TXT.
- Carga de audios como material de estudio.
- Transcripción STT con AssemblyAI.
- Extracción de texto y chunking de contenido.
- Generación de embeddings.
- Búsqueda semántica con pgvector.
- Chat tutor con RAG.
- Workflow conversacional con LangGraph.
- Tool calling para retrieval.
- Voice Agent conversacional por WebSocket.
- TTS con Cartesia para respuestas habladas.
- Quizzes con structured output validado.
- Historial conversacional persistido.
- Panel Admin Técnico para validación operativa.
- Despliegue en VPS con HTTPS.
- CI/CD con GitHub Actions.
- Terraform / IaC seguro y no destructivo.
- Backups y continuidad operativa.

## Arquitectura general

El sistema se compone de un frontend web, un backend API, una base de datos con soporte vectorial, servicios de IA externos y una capa operativa de despliegue.

```text
Usuario
  ↓
Frontend Next.js
  ↓
Backend Django REST
  ↓
PostgreSQL + pgvector
  ↓
LangGraph / RAG / Tools
  ↓
OpenAI / AssemblyAI / Cartesia
```

### Componentes principales

- `frontend/`: interfaz web en Next.js.
- `backend/`: API, lógica de negocio, chat, materiales, quizzes y voz.
- `PostgreSQL + pgvector`: persistencia relacional y vectorial.
- `LangGraph`: workflow conversacional del tutor.
- `OpenAI`: embeddings, generación de respuestas y structured output.
- `AssemblyAI`: speech-to-text.
- `Cartesia`: text-to-speech.
- `Docker Compose`: orquestación local y productiva.

## Arquitectura de IA

La capa de IA del proyecto se construye alrededor de varios conceptos clave:

### RAG

El sistema usa Retrieval-Augmented Generation. Antes de responder, recupera chunks relevantes desde la base vectorial y los inyecta como contexto al modelo.

### Embeddings

Cada chunk de contenido procesado se transforma en un vector semántico. Esto permite comparar significado, no solo texto literal.

### Retrieval

Cuando el usuario pregunta, el sistema genera un embedding de la consulta y busca coincidencias relevantes en `DocumentChunk`.

### Vector store

Los embeddings se almacenan en PostgreSQL usando `pgvector`, evitando un vector store externo adicional.

### LangGraph

El flujo conversacional usa LangGraph para estructurar el razonamiento del tutor y coordinar nodos, estado y tools.

### Tool calling

El workflow usa una tool de búsqueda sobre materiales para separar la recuperación semántica de la generación final de respuesta.

### Structured output

La generación de quizzes usa salida estructurada para producir JSON validable antes de persistir preguntas y opciones.

### Memoria conversacional

El sistema conserva contexto por `conversation_id`, permitiendo seguimiento, repreguntas y práctica continua.

### Protección contra prompt injection

El diseño incluye controles para reducir riesgo de respuestas fuera del material, limitar alucinaciones y evitar que contenido cargado altere el comportamiento del tutor más allá de su propósito de consulta.

## Flujo RAG

El flujo general del tutor académico es:

1. El usuario carga un documento o audio.
2. El sistema extrae texto o genera transcripción.
3. El contenido se divide en chunks.
4. Se generan embeddings para esos chunks.
5. Los embeddings se almacenan en PostgreSQL + pgvector.
6. El usuario hace una pregunta.
7. Se realiza búsqueda semántica sobre los chunks.
8. El backend construye un prompt con el contexto recuperado.
9. El modelo genera la respuesta del tutor.
10. La respuesta se entrega junto con referencias del material consultado.

## Flujo del Voice Agent

El flujo del modo voz es:

1. Micrófono del navegador.
2. WebSocket seguro sobre HTTPS/WSS.
3. STT con AssemblyAI.
4. Conversation Manager / LangGraph.
5. Retrieval y RAG si aplica.
6. Respuesta textual del tutor.
7. TTS con Cartesia.
8. Reproducción de audio al usuario.

Notas importantes:

- el navegador necesita HTTPS/WSS para una experiencia estable con micrófono
- texto y voz comparten el mismo cerebro conversacional
- el sistema usa control de turnos para evitar respuestas cruzadas o atrasadas

## Flujo de Quizzes

El flujo de quizzes funciona así:

1. El usuario selecciona un material procesado.
2. El backend usa chunks del contenido como base.
3. El LLM genera un quiz mediante structured output.
4. El JSON se valida antes de guardarse.
5. Se persisten `Quiz` y `QuizQuestion`.
6. El frontend muestra la interfaz de práctica y revisión.

## Stack tecnológico

| Tecnología | Uso principal |
| --- | --- |
| Next.js | Frontend web |
| TypeScript | Tipado del frontend |
| Tailwind CSS | Estilos y UI |
| Django | Backend principal |
| Django REST Framework | API REST |
| PostgreSQL | Base de datos relacional |
| pgvector | Almacenamiento vectorial |
| LangChain / LangGraph | Flujo conversacional y tools |
| OpenAI | Embeddings, chat y structured output |
| AssemblyAI | Speech-to-text |
| Cartesia | Text-to-speech |
| Docker | Contenerización |
| Docker Compose | Orquestación local y productiva |
| Nginx | Exposición y proxy interno |
| GitHub Actions | CI/CD |
| Terraform | IaC documental y seguro |

## Infraestructura y despliegue

La solución se despliega sobre una VPS Linux existente.

Puntos clave:

- ruta del proyecto: `/srv/tutoria-academico`
- URL pública: `https://tutoria.centromedicolosencinos.tech`
- despliegue con `docker-compose.prod.yml`
- proyecto aislado del sistema `LIS Los Encinos`
- no se modifica el LIS en producción

La infraestructura operativa actual usa:

- VPS Linux existente
- `docker-compose` v1 por compatibilidad del servidor
- Nginx externo del servidor
- Nginx interno del proyecto para exponer frontend, API y media

## CI/CD

El flujo de CI/CD funciona con GitHub Actions.

### Workflows del repositorio

El repositorio tiene dos workflows separados en `.github/workflows/`:

- `ci.yml`: valida backend y frontend
- `deploy.yml`: publica la versiÃ³n aprobada en la VPS

Esta separaciÃ³n ayuda a explicar el proceso al ingeniero: primero se verifica que el cÃ³digo estÃ© sano y luego se ejecuta el cambio operativo sobre el servidor.

### CÃ³mo funciona `ci.yml`

`ci.yml` se ejecuta en:

- `push` a `main`
- `pull_request` hacia `main`

El workflow divide la validaciÃ³n en dos jobs paralelos:

1. `backend`
2. `frontend`

#### Job `backend`

Entra a `backend/` y ejecuta:

- `actions/checkout@v4`
- `actions/setup-python@v5` con Python 3.12
- instalaciÃ³n de dependencias desde `requirements.txt`
- `python -m compileall apps config manage.py`
- `python manage.py check`

Para este job se definen variables de entorno mÃ­nimas de CI, de forma que Django pueda arrancar y validar configuraciÃ³n sin usar credenciales reales del entorno productivo.

#### Job `frontend`

Entra a `frontend/` y ejecuta:

- `actions/checkout@v4`
- `actions/setup-node@v4` con Node 20
- `npm ci`
- `npm run build`

Con esto se comprueba que la aplicaciÃ³n Next.js compile correctamente antes de permitir un despliegue.

### Qué ocurre en `push` a `main`

- se ejecuta validación de backend
- se ejecuta build de frontend
- si la validación pasa, se inicia el deploy

### Qué hace el deploy

`deploy.yml` solo escucha `push` a `main`, porque su responsabilidad ya no es revisar cÃ³digo sino actualizar producciÃ³n.

AdemÃ¡s, usa:

- `concurrency.group: deploy-production`
- `cancel-in-progress: false`

Eso evita que dos despliegues se pisen entre sÃ­.

Paso a paso, el workflow hace lo siguiente:

1. Se conecta por SSH al VPS usando GitHub Secrets.
2. Entra a `PROJECT_PATH`.
3. Verifica que existan `.env` y `docker-compose.prod.yml`.
4. Ejecuta `git fetch origin main`.
5. Ejecuta `git pull --ff-only origin main`.
6. Ejecuta `docker-compose -f docker-compose.prod.yml down --remove-orphans`.
7. Ejecuta `docker-compose -f docker-compose.prod.yml up -d --build`.
8. Ejecuta `docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate`.
9. Ejecuta `docker-compose -f docker-compose.prod.yml ps`.
10. Ejecuta `curl -f http://127.0.0.1:8088/api/health/`.
11. Si el healthcheck interno falla, intenta `curl -f https://tutoria.centromedicolosencinos.tech/api/health/`.

Esto deja documentado que el deploy no copia archivos manualmente: entra al repositorio ya clonado en la VPS y actualiza la versiÃ³n usando Git.

### Secrets usados por el deploy

Los secrets que el workflow necesita son:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `PROJECT_PATH`

`VPS_SSH_KEY` contiene la llave privada con la que GitHub Actions entra al servidor. Esa llave no vive en el repositorio ni dentro del `.env`.

### Notas operativas

- se usa `docker-compose` v1 por compatibilidad del VPS
- no se usa `docker compose`
- no se borran volúmenes
- `down --remove-orphans` recrea contenedores del proyecto sin eliminar datos persistentes

## Terraform / IaC

Infrastructure as Code (IaC) es la práctica de representar infraestructura mediante archivos versionados.

En este proyecto, Terraform se usó de forma segura porque:

- la VPS ya existía
- ya había producción en el servidor
- coexistía el sistema `LIS Los Encinos`

Por eso Terraform no crea ni modifica infraestructura real. En esta etapa:

- documenta variables operativas
- documenta outputs útiles
- representa ruta, dominio, puerto, backup path y estrategia de despliegue

### Mejora futura

En una fase posterior podría ampliarse para crear:

- VPS
- DNS
- firewall
- componentes adicionales de operación

## Persistencia

La persistencia del sistema se distribuye así:

- base de datos: PostgreSQL
- documentos: volumen `media_data`
- audios: volumen `media_data`
- transcripciones: base de datos
- embeddings: PostgreSQL + pgvector
- conversaciones: base de datos
- quizzes: base de datos
- backups: carpeta y volumen de respaldo en VPS

## Backup y continuidad

El proyecto incluye una estrategia básica de continuidad operativa.

### Qué se respalda

- base de datos PostgreSQL
- media: documentos y audios cargados

### Qué se maneja fuera del repo

- `.env`
- cualquier credencial sensible

### Scripts principales

- `scripts/backup.sh`
- `scripts/restore_db.sh`
- `scripts/restore_media.sh`
- `scripts/check-backup.sh`

### Política de retención

- se conservan los últimos 7 backups de DB
- se conservan los últimos 7 backups de media

### Estrategia de recuperación

1. Restaurar el repositorio desde GitHub.
2. Crear `.env`.
3. Levantar Docker Compose.
4. Restaurar base de datos.
5. Restaurar media.
6. Verificar healthcheck.

### Recomendación importante

Para un escenario real, se recomienda copiar backups fuera del VPS.

## Variables de entorno

Variables principales del proyecto, sin valores reales:

- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `OPENAI_API_KEY`
- `EMBEDDING_MODEL`
- `CHAT_MODEL`
- `RETRIEVAL_MIN_SCORE`
- `RETRIEVAL_MAX_DISTANCE`
- `ASSEMBLYAI_API_KEY`
- `ASSEMBLYAI_SPEECH_MODEL`
- `CARTESIA_API_KEY`
- `CARTESIA_LANGUAGE`
- `CARTESIA_VOICE_ID`
- `VOICE_AGENT_ENABLED`
- `VOICE_AGENT_TTS_ENABLED`
- `VOICE_AGENT_SILENCE_MS`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_VOICE_AGENT_SILENCE_MS`
- `MEDIA_ROOT`

Referencia base: [`.env.example`](.env.example)

## Ejecución local

### Con Docker Compose

```bash
cp .env.example .env
docker compose up --build
docker compose exec backend python manage.py migrate
```

URLs esperadas:

- frontend: `http://localhost:3000`
- backend health: `http://localhost:8000/api/health/`

### Frontend con npm local

```bash
cd frontend
npm install
npm run dev
```

### Backend sin Docker

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Despliegue en VPS

Flujo general:

```bash
cd /srv/tutoria-academico
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
curl -f http://127.0.0.1:8088/api/health/
```

Notas:

- la versión productiva se sirve en `https://tutoria.centromedicolosencinos.tech`
- no usar `docker-compose down -v`
- antes de cambios grandes, se recomienda ejecutar backup

### Cómo se preparó la configuración en la VPS

La configuración del servidor se preparó manualmente y de forma controlada porque la VPS ya existía y compartía infraestructura con otro sistema en producción: `LIS Los Encinos`.

### Objetivo de la preparación

El objetivo no era reconstruir la VPS desde cero, sino dejar un entorno aislado para `TutorIA Académico` con estas condiciones:

- despliegue independiente
- no afectar al otro sistema del servidor
- permitir actualización automática por GitHub Actions
- conservar datos persistentes entre despliegues

### Preparación base del servidor

En la VPS se validó previamente que existieran:

- acceso por SSH
- `git`
- Docker
- `docker-compose` v1

Se mantuvo `docker-compose` v1 porque era la versión compatible con el entorno real del servidor.

### Aislamiento del proyecto

Para no mezclar esta app con el resto del servidor, se preparó una ruta exclusiva:

- `/srv/tutoria-academico`

Dentro de esa carpeta se dejó:

- el repositorio clonado
- la rama `main` como fuente de despliegue
- el archivo `.env` creado manualmente
- el archivo `docker-compose.prod.yml`

Eso permite que el workflow entre siempre al mismo directorio y ejecute el despliegue sin depender de transferencias manuales de archivos.

### Configuración sensible y variables

La configuración sensible no se versionó en Git. Se preparó directamente en la VPS mediante `.env`, incluyendo por ejemplo:

- `DJANGO_SECRET_KEY`
- credenciales de PostgreSQL
- `DJANGO_ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `OPENAI_API_KEY`
- `ASSEMBLYAI_API_KEY`
- `CARTESIA_API_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`

Por separado, en GitHub se registraron los Secrets del deploy para el acceso remoto por SSH.

### Configuración de contenedores

La publicación productiva se apoya en `docker-compose.prod.yml`, donde se organizan cuatro servicios:

- `db`
- `backend`
- `frontend`
- `nginx`

La separación es importante porque permite:

- persistir la base de datos aparte
- reconstruir frontend y backend sin perder información
- centralizar el acceso web a través de Nginx

### Configuración de publicación

El entorno fue preparado para responder por:

- dominio público: `https://tutoria.centromedicolosencinos.tech`
- healthcheck interno: `http://127.0.0.1:8088/api/health/`

Ese doble punto de validación sirve para distinguir si el problema está:

- dentro del stack de contenedores
- en la publicación externa o el proxy

### Preparación para GitHub Actions

Para que el deploy automático funcione, se dejó listo:

- usuario con acceso SSH a la VPS
- llave pública autorizada en el servidor
- llave privada guardada en `VPS_SSH_KEY`
- `PROJECT_PATH` apuntando a `/srv/tutoria-academico`

Con eso, GitHub Actions no hace SCP ni reempaqueta el proyecto. Solo entra al servidor, actualiza con `git pull --ff-only` y recrea contenedores.

### Verificación operativa posterior

Una vez preparada la VPS, la comprobación inicial del entorno consistió en:

1. levantar servicios con `docker-compose -f docker-compose.prod.yml up -d --build`
2. correr migraciones
3. revisar `docker-compose -f docker-compose.prod.yml ps`
4. validar `api/health/`
5. comprobar acceso por dominio

Ese mismo criterio luego quedó reflejado en el workflow `deploy.yml`, por lo que la automatización replica el procedimiento operativo manual que primero se probó en el servidor.

## Demo sugerida para presentación

Secuencia sugerida para la exposición final:

1. Abrir la app en HTTPS.
2. Mostrar dashboard y navegación.
3. Subir un documento.
4. Mostrar chunks y embeddings generados.
5. Preguntar algo al chat tutor.
6. Probar el voice agent.
7. Generar un quiz.
8. Mostrar GitHub Actions.
9. Mostrar Terraform.
10. Mostrar backup o revisión de backups.

## Limitaciones actuales

- La UI todavía puede mejorar en pulido visual final.
- El voice agent depende de permisos de navegador y micrófono.
- No hay autenticación avanzada ni roles completos.
- No existe monitoreo enterprise.
- Terraform no crea la VPS real por seguridad.
- Los backups viven en la VPS y se recomienda copia externa.

## Mejoras futuras

- autenticación y roles
- dashboard de métricas
- STT streaming más avanzado
- monitoreo con Prometheus / Grafana
- backups externos automáticos
- Terraform con provider real
- migración planificada a Compose v2
- mejor diseño visual

## Qué debe saber el equipo para exponer

### Qué problema resolvemos

Resolvemos la dificultad de estudiar con materiales dispersos y poco interactivos.

### Qué hace la app

Permite cargar contenido, procesarlo, preguntar sobre él, hablar con un tutor por voz y practicar con quizzes.

### Qué parte cubre IA

La parte de IA incluye:

- embeddings
- búsqueda semántica
- RAG
- LangGraph
- tool calling
- STT
- TTS
- structured output

### Qué parte cubre Administración TI

La parte de Admin TI incluye:

- despliegue en VPS
- Docker Compose
- HTTPS
- CI/CD con GitHub Actions
- Terraform seguro como evidencia de IaC
- backups y continuidad operativa

### Cómo funciona RAG

El sistema convierte materiales en chunks con embeddings, recupera contexto relevante ante cada pregunta y usa ese contexto para responder con mayor precisión.

### Cómo funciona CI/CD

GitHub Actions valida backend y frontend, se conecta por SSH al VPS y recrea contenedores con `docker-compose` sin borrar volúmenes.

### Cómo funciona backup

Se genera un dump SQL de PostgreSQL y un comprimido de media, ambos con retención de los últimos 7 respaldos.

### Por qué Terraform se usó de forma segura

Porque la VPS ya existía y tenía producción activa. Terraform se usó para documentar infraestructura y valores operativos sin arriesgar el entorno real.

## Documentación complementaria

- [Despliegue VPS](docs/despliegue-vps.md)
- [CI/CD](docs/cicd.md)
- [Terraform](docs/terraform.md)
- [Backup y continuidad](docs/backup-continuidad.md)
- [Arquitectura](docs/arquitectura.md)
- [Decisiones técnicas](docs/decisiones-tecnicas.md)
