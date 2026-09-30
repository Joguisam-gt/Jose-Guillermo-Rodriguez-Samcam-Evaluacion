# Job Applications REST API

API REST profesional desarrollada en **Node.js**, **Express** y **MongoDB (Driver Nativo)** para la gestión, evaluación automatizada y seguimiento de postulaciones laborales.

El sistema implementa un **Motor de Scoring Autónomo**, clasificación dinámica de prioridades (`TOP`, `HIGH`, `MEDIUM`, `LOW`), detección de duplicados, validaciones de seguridad mediante **JWT** e inmutabilidad para estados finales de auditoría.

---

## 🏗️ Arquitectura del Sistema

El proyecto está diseñado bajo una **Arquitectura en Capas (Clean/Layered Architecture)** con estricta separación de responsabilidades:

```text
├── src/
│   ├── config/          # Conexión Singleton a MongoDB y variables de entorno
│   ├── controllers/     # Manejo de peticiones/respuestas HTTP y códigos de estado
│   ├── services/        # Lógica de negocio pura, cálculo de Scoring y reglas
│   ├── repositories/    # Capa de datos y consultas desnormalizadas a MongoDB
│   ├── middlewares/     # Autenticación JWT y manejo centralizado de errores
│   ├── routes/          # Definición de rutas y endpoints de la API
│   └── utils/           # Constantes del sistema y formateadores de error
├── __tests__/           # Pruebas unitarias automatizadas con Jest
├── scripts/
│   ├── seed.js          # Siembra de datos e inicialización de 15 índices estratégicos
│   └── test-endpoints.js# Batería de pruebas E2E automatizadas para la API
├── .env.example         # Plantilla de variables de entorno
├── RESPUESTAS.md        # Documentación sobre estrategia e integración de IA
└── README.md            # Guía técnica y manual de ejecución
```

## 🧠 Lógica de Negocio y Motor de Scoring
1. Reglas de Cálculo de Scoring

Cada postulación recibe un puntaje automático basado en los siguientes criterios:

**Experiencia Laboral**: Puntos equivalentes a los años de experiencia del candidato.

**Fuente de Reclutamiento**: +3 puntos adicionales si la fuente es REFERRAL.

Carta de Presentación: +2 puntos si incluye términos clave técnicos (Node.js o SQL).

**Penalización por Multi-Postulacion**: -2 puntos si el candidato mantiene postulaciones activas (RECEIVED o IN_REVIEW) en otras vacantes.

2. Matriz de Priorización

    TOP: Scoring ≥ 7

    HIGH: Scoring 5 a 6

    MEDIUM: Scoring 3 a 4

    LOW: Scoring < 3

3. Validaciones y Reglas de Dominio

    Detección de Duplicados (409 Conflict): Bloquea postulaciones si el candidato ya cuenta con un registro activo para la misma vacante.

    Estado de Vacante (400 Bad Request): Impide el registro en vacantes con estado CLOSED.

    Inmutabilidad de Estado Final (400 Bad Request): Restringe cualquier actualización de estado si la postulación se encuentra en REJECTED o HIRED.

    Protección JWT (401/403): Requiere token Bearer para mutaciones de estado en PUT /applications/:id/status.

## ⚡ Estrategia de Indexación en MongoDB (15 Índices)

El script de siembra construye 5 índices estratégicos por colección para optimizar el rendimiento de lectura:
Colección	Índices Creados	Propósito
candidates	email (Unique), {yearsOfExperience: -1, name: 1}, name (Text), createdAt, {email: 1, name: 1}	Garantiza correos únicos y aceleración de filtros.
vacancies	{status: 1, minYearsOfExperience: 1}, title (Text), {status: 1, createdAt: -1}, {title: 1, status: 1}, {minYearsOfExperience: 1, status: 1}	Búsqueda rápida de vacantes abiertas y filtros por perfil.
applications	{score: -1, createdAt: 1}, {'candidate.candidateId': 1, 'vacancy.vacancyId': 1, status: 1}, {'candidate.email': 1, createdAt: -1}, {priority: 1, status: 1}, {status: 1, 'vacancy.vacancyId': 1, score: -1, createdAt: 1}	Ordenamiento determinístico sin Sort en memoria.

### 🛠️ Requisitos Previos

    Node.js: v20.0.0 o superior

    npm: v10.0.0 o superior

    MongoDB: Instancia local corriendo en mongodb://127.0.0.1:27017 o cluster MongoDB Atlas.

 ### 🚀 Guía de Ejecución Paso a Paso (Orden de Terminal)

Sigue estos comandos en la terminal exactamente en el siguiente orden para levantar y verificar el proyecto completo:
1. Clonar e Instalar Dependencias
```Bash

npm install
```

2. Configurar Variables de Entorno

Crea el archivo .env a partir de la plantilla de ejemplo:
```Bash

cp .env.example .env
```

Si deseas modificar los valores por defecto, verifica que el archivo contenga:
```Fragmento de código

PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017
DB_NAME=job_portal_db
JWT_SECRET=super_secret_jwt_key_2026
```

3. Poblar Base de Datos e Inicializar Índices

Ejecuta el script de siembra para limpiar colecciones, crear los 15 índices estratégicos e insertar los candidatos/vacantes de prueba:
```Bash

npm run seed
```

4. Ejecutar Pruebas Unitarias (Jest)

Valida la suite de pruebas automatizadas sobre el motor de scoring y las funciones puras del sistema:
```Bash

npm test
```

5. Iniciar Servidor de la API

Inicia el servidor en modo desarrollo con recarga en caliente (Nodemon):
```Bash

npm run dev
```

El servidor quedará escuchando en http://localhost:3000.

6. Probar Endpoints con el Script de Integración E2E

Abre una segunda pestaña en la terminal (con el servidor corriendo en la primera) y ejecuta la suite automatizada de endpoints:
```Bash

npm run test:endpoints
```

7. Comprimir Proyecto para Entrega Final

Para empaquetar los entregables en un archivo .zip excluyendo node_modules y .git:
```Bash

zip -r Jose_Rodriguez_Backend_Prueba.zip . -x "node_modules/*" ".git/*"
```

## 📋 Referencia de Endpoints API
1. Crear Postulación
```text

    HTTP: POST /applications

    Headers: Content-Type: application/json

    Body:
    JSON

    {
      "candidateId": "6512a1b2c3d4e5f6a7b8c9d0",
      "vacancyId": "6512a1b2c3d4e5f6a7b8c9e0",
      "source": "REFERRAL",
      "coverLetter": "Tengo 4 años de experiencia construyendo APIs REST con Node.js y bases de datos SQL."
    }
```

    Códigos de Respuesta:

        201 Created: Postulación creada con scoring y prioridad calculados.

        400 Bad Request: Datos de entrada inválidos o vacante cerrada.

        404 Not Found: Candidato o vacante no encontrados.

        409 Conflict: Postulación duplicada activa.

2. Consultar Postulaciones (Con Filtros y Orden)

    HTTP: GET /applications

    Query Parameters (Opcionales): status, vacancyId

    Ejemplos:

        GET /applications

        GET /applications?status=RECEIVED

        GET /applications?status=IN_REVIEW&vacancyId=6512a1b2c3d4e5f6a7b8c9e0

    Códigos de Respuesta:

        200 OK: Lista ordenada descendentemente por score y ascendentemente por createdAt.

3. Actualizar Estado de Postulación

    HTTP: PUT /applications/:id/status

    Headers:

        Content-Type: application/json

        Authorization: Bearer <JWT_TOKEN>

    Body:
    JSON

    {
      "status": "IN_REVIEW"
    }

    Códigos de Respuesta:

        200 OK: Estado actualizado correctamente.

        400 Bad Request: Intento de modificación sobre estado inmutable (REJECTED o HIRED).

        401 Unauthorized: Token de autorización ausente o con formato inválido.

        403 Forbidden: Token expirado o firma inválida.

        404 Not Found: Postulación no encontrada.

## 📜 Entregables Incluidos

    Código Fuente Decoupled y Limpio: Proyecto estructurado en capas sin librerías ORM/ODM pesadas.

    RESPUESTAS.md: Documento analítico con soluciones a la integración de IA (Extracción de Habilidades, Manejo de Fallas en LLMs y Justificación Ética/Técnica sobre Algoritmos Determinísticos vs IA).

    scripts/seed.js: Script de automatización de base de datos e indexación.

    scripts/test-endpoints.js: Cliente de pruebas E2E nativo.