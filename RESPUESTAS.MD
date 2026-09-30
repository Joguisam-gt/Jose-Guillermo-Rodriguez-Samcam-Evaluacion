# Respuestas - Fundamentos de Integración de IA en el Proceso de Reclutamiento

## Pregunta 1
**¿Cómo integraría la capacidad de identificar automáticamente habilidades técnicas desde la carta de presentación y compararlas con la vacante?**

Para integrar esta función sin degradar el rendimiento del flujo HTTP síncrono de la API, utilizaría una **arquitectura basada en eventos asíncronos**:

1. **Encolamiento:** Al registrar con éxito la postulación en `POST /applications`, el controlador emite un evento `APPLICATION_CREATED` a un sistema de mensajería (RabbitMQ, Redis Streams o AWS SQS).
2. **Procesamiento en Background:** Un worker en segundo plano consume el evento y realiza la llamada al modelo de lenguaje (OpenAI API o un modelo local en Ollama) utilizando **Structured Outputs (JSON Schema)** obligatorio para extraer un arreglo estandarizado de habilidades.
3. **Comparación y Persistencia:** El worker contrasta las habilidades extraídas contra las requeridas por la vacante, calcula un porcentaje de coincidencia (*match rate*) y actualiza el documento desnormalizado en MongoDB en un campo dedicado:
   ```json
   {
     "aiSkillsAnalysis": {
       "extractedSkills": ["Node.js", "Express", "MongoDB"],
       "matchRate": 85,
       "processedAt": "2026-09-30T19:15:00.000Z"
     }
   }

**¿Cómo manejar las respuestas con formato inválido o habilidades inexistentes en el catálogo de la empresa?**

Para asegurar la resiliencia ante el comportamiento probabilístico de los LLM, implementaría un esquema de Defensa en Profundidad:

Restricción a Nivel de Prompt y API: Forzar respuestas mediante el parámetro response_format utilizando un JSON Schema estricto.


Validación Sintáctica en Backend: Al recibir la respuesta del LLM, el worker valida la estructura con librerías como Zod o Joi. Si la sintaxis falla, se activa una política de reintentos (exponential backoff). Si el error persiste, el mensaje se traslada a una Dead Letter Queue (DLQ) para inspección manual sin interrumpir el flujo del sistema.

Validación Semántica contra Catálogo Oficial (Whitelist): Se cruzan las habilidades devueltas contra una colección de habilidades homologadas (skillsCatalog). Las habilidades no reconocidas o alucinadas se filtran o se marcan con el atributo "unverified": true para revisión del reclutador.

¿Considera apropiado reemplazar completamente las reglas determinísticas de prioridad por la decisión de una IA? Justificación técnica y ética.

No considero apropiado reemplazar el motor determinístico por una decisión autónoma de IA. Las razones técnicas y éticas principales son:

**Explicabilidad y Trazabilidad (XAI)**: Un motor de reglas determinístico (+4 exp, +3 referido, etc.) es 100% auditable. Si un candidato o auditor cuestiona una calificación, el sistema puede reconstruir la fórmula matemática exacta. Un modelo generativo no ofrece esa garantía.

**Mitigación de Sesgos Algorítmicos**: Los modelos de IA pueden replicar o amplificar sesgos implícitos presentes en sus datos de entrenamiento (favoreciendo ciertos giros lingüísticos, géneros, o formatos de redacción sobre competencias reales).

**Consistencia y Determinismo**: Entradas idénticas en la API deben generar siempre resultados idénticos. Las variaciones de temperatura en el modelo pueden producir clasificaciones inconsistentes para perfiles equivalentes.

**Enfoque Recomendado**: Mantener el motor determinístico para la clasificación y ordenamiento principal de prioridad (LOW, MEDIUM, HIGH, TOP), y utilizar la IA de forma complementaria (Human-in-the-Loop) para resumir la carta de presentación o sugerir coincidencias de habilidades al reclutador.