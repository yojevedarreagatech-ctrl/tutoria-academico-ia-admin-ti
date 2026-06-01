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
