# Decisiones tecnicas iniciales

## Estado

Documento base de Sprint 0. Aqui se registran decisiones de arquitectura y stack para mantener trazabilidad entre los cursos de Inteligencia Artificial y Administracion de TI.

## Decisiones acordadas

- Frontend con Next.js, TypeScript y Tailwind CSS.
- Backend con Python, Django y Django REST Framework.
- Base de datos prevista con PostgreSQL y extension `pgvector`.
- Contenerizacion con Docker y orquestacion local con Docker Compose.
- CI/CD futuro con GitHub Actions.
- Infraestructura como codigo futura con Terraform.
- Despliegue objetivo en VPS Linux bajo `/srv/tutoria-academico` y puerto `8088`.

## Justificacion de PostgreSQL + pgvector

- Permite mantener datos transaccionales y vectores en el mismo sistema.
- Simplifica despliegue en VPS al evitar un vector store separado en esta etapa.
- Reduce complejidad operativa para el curso de Administracion de TI.
- Deja una ruta clara para evolucionar a busqueda semantica antes de introducir RAG completo.

## Justificacion de separar retrieval y generacion

- Mantiene bajo acoplamiento entre busqueda semantica y capa LLM.
- Permite probar retrieval de forma aislada desde API o UI tecnica.
- Facilita evolucion futura hacia agentes o flujos mas complejos sin reescribir el buscador.
- Mejora el manejo de errores cuando falla el embedding, el retrieval o el modelo de lenguaje.

## Justificacion de LangGraph en esta etapa

- Permite introducir un workflow con estado sin romper el contrato externo del chat.
- Hace visible la separacion entre nodos, tools y generacion.
- Sirve como base defendible para evolucionar a flujos agentic mas complejos en siguientes sprints.

## Justificacion de STT, TTS y WebSocket

- AssemblyAI simplifica la transcripcion de audio con una API y SDK ya orientados a Speech AI.
- Cartesia permite devolver voz sintetizada de forma rapida para la demo del tutor por voz.
- WebSocket da una experiencia mas natural para voz que un request/response tradicional.
- El prompt defensivo reduce riesgo de prompt injection desde documentos y transcripciones cargadas.

## Justificacion del turn-taking por silencio

- Evita obligar al usuario a presionar grabar/detener en cada pregunta.
- Mantiene el sistema simple sin agregar Redis, Celery ni streaming server-side complejo.
- Permite una experiencia cercana a conversacion real usando el workflow RAG ya existente.

## Justificacion del Conversation Manager compartido

- Evita tener dos cerebros distintos para chat textual y voice agent.
- Permite que texto y voz compartan la misma deteccion de intenciones, continuidad y reglas de negocio.
- Hace posible decidir si un turno requiere retrieval, historial previo o rechazo directo sin duplicar prompts.
- Reduce tokens porque follow-ups como `mas corto`, `repiteme` o `dame un ejemplo` no rehacen retrieval siempre.

## Justificacion del retrieval gating

- Evita responder con definiciones del material cuando la pregunta esta fuera de alcance.
- Corta alucinaciones antes de llamar al LLM.
- Hace configurable el comportamiento con `RETRIEVAL_MIN_SCORE` y `RETRIEVAL_MAX_DISTANCE`.
- Da una respuesta consistente y defendible: `No puedo responder eso con la informacion cargada.`

## Justificacion de structured output para quizzes

- Evita respuestas libres dificiles de guardar en base de datos.
- Permite validar que cada pregunta tenga 4 opciones y una respuesta correcta consistente.
- Facilita persistencia limpia en `Quiz` y `QuizQuestion`.
- Hace la demo mas defendible porque muestra validacion previa al guardado.

## Decisiones diferidas a siguientes sprints

- Estrategia exacta de autenticacion y autorizacion.
- Estructura final de apps Django.
- Patron de integracion de LLM, RAG y agentes.
- Manejo de almacenamiento de documentos y media.
- Observabilidad, monitoreo y rotacion de logs.

## Criterios para siguientes decisiones

- Mantener bajo acoplamiento entre frontend, backend e integraciones de IA.
- Favorecer despliegues simples y repetibles.
- Documentar primero, automatizar despues.
- Evitar complejidad temprana en Sprint 0.
