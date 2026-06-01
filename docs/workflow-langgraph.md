# Workflow LangGraph

## Objetivo

Este workflow mueve el flujo del chat RAG a un grafo con estado compartido, manteniendo compatible el endpoint `POST /api/chat/ask/`.

## Estado compartido

El estado base vive en `backend/apps/ai_core/state.py` e incluye:

- `question`
- `conversation_id`
- `top_k`
- `material_id`
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
   Ejecuta `search_materials_tool` y guarda `retrieved_chunks` y `sources`.

5. `generate_answer`
   Usa el contexto recuperado y el historial reciente para llamar al LLM.

6. `save_conversation`
   Nodo de cierre. El guardado real de mensajes sigue orquestado en `chat/views.py` para no romper el contrato externo actual.

## Tool usada

`search_materials_tool`

- Usa `semantic_search()` ya existente.
- Recupera chunks relevantes desde PostgreSQL + pgvector.
- Devuelve datos serializables para la siguiente etapa del workflow.

## Relacion con RAG

El workflow implementa una forma base de RAG:

1. entra una pregunta
2. se consulta retrieval semantico
3. se recupera contexto
4. se arma un prompt con contexto e historial
5. el modelo responde

## Limitaciones actuales

- La decision de tools todavia es simple, no dinamica.
- No hay LangGraph con memoria persistente avanzada.
- No hay tool calling formal multi-tool.
- No hay LangGraph orientado a agentes complejos ni ramas sofisticadas.
- No incluye STT ni generacion de quizzes.
