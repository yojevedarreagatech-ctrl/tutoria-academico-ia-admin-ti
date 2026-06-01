# Workflow LangGraph

## Objetivo

Este workflow mueve el flujo del chat RAG a un grafo con estado compartido, manteniendo compatible el endpoint `POST /api/chat/ask/`.

## Estado compartido

El estado base vive en `backend/apps/ai_core/state.py` e incluye:

- `question`
- `retrieval_query`
- `user_intent`
- `awaiting_practice_answer`
- `last_practice_question`
- `conversation_id`
- `top_k`
- `material_id`
- `response_mode`
- `conversation_history`
- `retrieved_chunks`
- `sources`
- `answer`
- `error`

## Nodos del workflow

1. `receive_question`
   Normaliza y valida la pregunta inicial.

2. `retrieve_context`
   Prepara parametros como `top_k` y `material_id`.

3. `decide_tool`
   Decide si se llama la tool de retrieval. Por ahora la decision es simple: si hay pregunta, usa la tool.

4. `call_tool`
   Ejecuta `search_materials_tool` usando la query original o una query enriquecida con historial para follow-ups cortos, y guarda `retrieved_chunks` y `sources`.

5. `generate_answer`
   Usa el contexto recuperado, el historial reciente y la intencion conversacional para llamar al LLM.

6. `save_conversation`
   Nodo de cierre. El guardado real de mensajes sigue orquestado en `chat/views.py` para no romper el contrato externo actual.

## Tool usada

`search_materials_tool`

- Usa `semantic_search()` ya existente.
- Puede usar `retrieval_query` enriquecida cuando la pregunta actual depende del turno anterior.
- Recupera chunks relevantes desde PostgreSQL + pgvector.
- Devuelve datos serializables para la siguiente etapa del workflow.

## Conversation Manager

En Sprint 7.5, LangGraph queda envuelto por un `conversation_manager` compartido entre chat textual y voz.

Responsabilidades del manager:

- detectar `intent`
- decidir `action`
- decidir si hace falta retrieval o si basta historial reciente
- aplicar retrieval gating antes de llamar al LLM
- reutilizar el mismo flujo en texto y voz

La decision interna se representa asi:

```json
{
  "intent": "ask_shorter",
  "action": "shorten_previous_answer",
  "needs_retrieval": false,
  "needs_llm": true,
  "reason": "Use the previous answer without spending retrieval again."
}
```

## Relacion con RAG

El workflow implementa una forma base de RAG:

1. entra una pregunta
2. se consulta retrieval semantico
3. se recupera contexto
4. se arma un prompt con contexto e historial
5. el modelo responde
6. las fuentes se devuelven como metadata separada, no pegadas a la respuesta del LLM

## Retrieval gating

Antes de responder preguntas nuevas sobre el material:

1. retrieval recupera chunks
2. `retrieval_is_relevant()` valida umbral
3. si no pasa el umbral, no se llama al LLM
4. la respuesta es exactamente: `No puedo responder eso con la informacion cargada.`

Esto reduce alucinaciones y tambien ahorra tokens en preguntas fuera de alcance.

## Modo practica conversacional

Cuando el usuario pide practicar:

1. se detecta `user_intent=ask_practice_question`
2. el tutor genera una sola pregunta basada en el material
3. si el siguiente turno del usuario responde esa pregunta, se detecta `user_intent=answer_practice_question`
4. el retrieval se enriquece con la ultima pregunta de practica y la respuesta del usuario
5. el tutor evalua la respuesta antes de ofrecer otra pregunta

## Reutilizacion con voice agent

El voice agent del Sprint 7 reutiliza el mismo workflow:

1. el navegador captura audio
2. cada turno recibe un `turn_id`
3. el backend obtiene una transcripcion
4. esa transcripcion entra en la misma funcion comun de turno conversacional que usa el chat textual
5. la funcion conserva `conversation_id`, historial, `practice_state` y enrichment para preguntas de seguimiento
6. el workflow LangGraph ejecuta retrieval + generacion
7. la respuesta textual limpia se convierte a voz con TTS
8. el frontend vuelve a escuchar automaticamente al terminar la reproduccion

## Control de turnos en voz

- `conversation_id` identifica la conversacion completa
- `turn_id` identifica cada turno individual del usuario
- el backend procesa un solo turno a la vez
- el frontend ignora eventos atrasados cuyo `turn_id` ya no coincide con el turno actual

## Limitaciones actuales

- La decision de tools todavia es simple, no dinamica.
- No hay LangGraph con memoria persistente avanzada.
- No hay tool calling formal multi-tool.
- No hay LangGraph orientado a agentes complejos ni ramas sofisticadas.
- El voice agent usa deteccion de silencio en frontend como fallback conversacional en lugar de streaming STT completo.
- Los quizzes son un flujo separado de practica academica y no reemplazan al chat RAG.
