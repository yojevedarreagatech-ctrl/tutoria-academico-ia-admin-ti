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

## Flujo de embeddings y retrieval en Sprint 4

```text
Chunks persistidos
  |
  v
Generacion de embeddings
  |
  v
Almacenamiento en pgvector dentro de PostgreSQL
  |
  v
Embedding de la query
  |
  v
Semantic search por similitud
```

## Flujo RAG en Sprint 5

```text
Pregunta del usuario
  |
  v
Embedding de la pregunta
  |
  v
Retrieval con pgvector
  |
  v
Prompt con contexto + historial reciente
  |
  v
LLM genera respuesta
  |
  v
Persistencia de mensajes y devolucion de fuentes
```

## Workflow agentic en Sprint 6

```text
Pregunta
  |
  v
Estado compartido
  |
  v
Tool de retrieval
  |
  v
Contexto recuperado
  |
  v
Generacion de respuesta
  |
  v
Respuesta final
```

## Audio como material en Sprint 7

```text
Audio
  |
  v
AssemblyAI STT
  |
  v
Transcripcion
  |
  v
Chunks
  |
  v
Embeddings
  |
  v
pgvector
  |
  v
RAG
```

## Voice Agent en Sprint 7.1

```text
Microfono
  |
  v
turn_id por turno
  |
  v
WebSocket
  |
  v
Deteccion de silencio / fin de turno
  |
  v
STT
  |
  v
LangGraph / RAG
  |
  v
Respuesta textual
  |
  v
Cartesia TTS
  |
  v
Audio al navegador
  |
  v
Nueva escucha automatica
```

## Control de sesion y turnos

- `conversation_id` mantiene la continuidad de toda la sesion
- `turn_id` evita mezclar respuestas atrasadas entre turnos
- `practice_state` mantiene si el tutor esta esperando respuesta a una pregunta de practica

## Dos modos de tutor

- Chat textual conversacional con RAG y continuidad por `conversation_id`
- Voice agent conversacional con WebSocket, STT, LangGraph/RAG y TTS

Ambos modos comparten la misma logica central del tutor:

- mismo historial conversacional
- mismo retrieval semantico
- mismo workflow LangGraph
- mismas reglas de seguridad del prompt

La diferencia real es solo la capa de entrada y salida.

## Modo practica

```text
Usuario pide practicar
  |
  v
Deteccion de intencion conversacional
  |
  v
Pregunta de practica basada en el material
  |
  v
Respuesta del usuario
  |
  v
Evaluacion apoyada en historial + retrieval enriquecido
```

## Conversation Manager compartido

En Sprint 7.5 se agrega un modulo central:

- `backend/apps/ai_core/conversation_manager.py`

Ese modulo decide el tipo de turno antes de responder y es compartido por:

- chat textual: texto -> conversation manager -> respuesta
- voice agent: audio -> STT -> conversation manager -> respuesta -> TTS

## Estado conversacional explicito

El `session_state` conserva:

- `practice_state`
- `last_practice_question`
- `last_topic`
- `last_answer`
- `last_sources`
- `last_retrieval_query`

Esto permite:

- no rehacer retrieval para cada follow-up
- responder "mas corto" sobre la respuesta previa
- usar continuidad real para ejemplos, practica y simplificacion

## Retrieval gating

Antes de llamar al LLM, el sistema valida si retrieval encontro contexto suficiente.

Variables:

- `RETRIEVAL_MIN_SCORE`
- `RETRIEVAL_MAX_DISTANCE`

Si retrieval no pasa el umbral, el sistema no inventa y responde:

`No puedo responder eso con la informacion cargada.`

## Acciones del tutor

El conversation manager convierte la intencion detectada en una accion concreta:

- `answer_from_material`
- `refuse_out_of_scope`
- `shorten_previous_answer`
- `simplify_previous_answer`
- `give_example`
- `ask_practice_question`
- `evaluate_practice_answer`
- `clarify`

## Flujo de quizzes con structured output

```text
Material procesado
  |
  v
Chunks
  |
  v
LLM con salida JSON estructurada
  |
  v
Validacion del payload
  |
  v
Persistencia de Quiz + QuizQuestion
  |
  v
UI de practica en /quizzes
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
- Sprint 4: embeddings y busqueda semantica.
- Sprint 5: chat tutor con RAG.
- Siguientes sprints: integracion progresiva de IA, RAG, almacenamiento vectorial, despliegue y continuidad operativa.
