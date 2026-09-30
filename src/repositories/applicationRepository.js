import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { APPLICATION_STATUS } from '../utils/constants.js';

const COLLECTION_NAME = 'applications';

/**
 * Guarda una nueva postulación utilizando un modelo Desnormalizado (Embebido).
 * @param {Object} applicationData - Objeto procesado con scoring, candidate e vacancy datos.
 * @returns {Promise<Object>} Documento completo persistido en MongoDB con su _id autogenerado.
 */
export const createApplication = async (applicationData) => {
  const db = getDB();
  const now = new Date(); // Estampa de tiempo exacta para garantizar auditoría
  
  // ESTRUCTURACIÓN DEL DOCUMENTO DESNORMALIZADO:
  // En lugar de guardar solo los IDs y forzar un $lookup (JOIN) en cada lectura, 
  // copiamos los datos principales del candidato y la vacante dentro del mismo documento.
  // Esto maximiza la velocidad de lectura de la API.
  const document = {
    ...applicationData,
    candidate: {
      // Convertimos la cadena de ID a ObjectId explícito para mantener integridad relacional lógica
      candidateId: new ObjectId(applicationData.candidate.candidateId),
      name: applicationData.candidate.name,
      email: applicationData.candidate.email,
      yearsOfExperience: applicationData.candidate.yearsOfExperience
    },
    vacancy: {
      vacancyId: new ObjectId(applicationData.vacancy.vacancyId),
      title: applicationData.vacancy.title,
      minYearsOfExperience: applicationData.vacancy.minYearsOfExperience
    },
    status: APPLICATION_STATUS.RECEIVED, // Estado inicial por regla de negocio
    statusUpdatedAt: now,                // Control de la regla de 30 días en rechazos
    createdAt: now,
    updatedAt: now
  };

  // 'insertOne' escribe el documento en el disco de la base de datos.
  const result = await db.collection(COLLECTION_NAME).insertOne(document);
  
  // Retornamos la respuesta combinando el ID generado (_id) y el contenido guardado.
  return { _id: result.insertedId, ...document };
};

/**
 * Busca las postulaciones previas de un candidato a una vacante específica.
 * Sirve para validar la regla de duplicidad (evaluar estados activos o tiempo tras rechazo).
 */
export const findApplicationsByCandidateAndVacancy = async (candidateId, vacancyId) => {
  const db = getDB();

  // NOTACIÓN DE PUNTO (Dot Notation):
  // Para consultar campos dentro de objetos embebidos usamos 'candidate.candidateId'.
  // '.toArray()' convierte el Cursor de MongoDB (stream) en un arreglo JS de objetos en memoria.
  return await db.collection(COLLECTION_NAME).find({
    'candidate.candidateId': new ObjectId(candidateId),
    'vacancy.vacancyId': new ObjectId(vacancyId)
  }).toArray();
};

/**
 * Cuenta cuántas postulaciones ACTIVAS tiene el candidato en OTRAS vacantes distintas a la actual.
 * Sirve para aplicar la penalización (-2 puntos) en el cálculo de prioridad.
 */
export const countActiveApplicationsInOtherVacancies = async (candidateId, currentVacancyId) => {
  const db = getDB();

  // OPERADORES NATIVOS DE MONGODB:
  // '$ne' (Not Equal): Excluye la vacante a la que se está postulando en este instante.
  // '$in' (In Array): Busca postulaciones cuyo 'status' sea 'RECEIVED' O 'IN_REVIEW'.
  return await db.collection(COLLECTION_NAME).countDocuments({
    'candidate.candidateId': new ObjectId(candidateId),
    'vacancy.vacancyId': { $ne: new ObjectId(currentVacancyId) },
    status: { $in: [APPLICATION_STATUS.RECEIVED, APPLICATION_STATUS.IN_REVIEW] }
  });
};

/**
 * Consulta y ordena las postulaciones aplicando filtros opcionales.
 * @param {Object} filters - Objeto con posibles parámetros { status, vacancyId }.
 * @returns {Promise<Array>} Lista de postulaciones ordenadas secuencialmente.
 */
export const findAllApplications = async ({ status, vacancyId }) => {
  const db = getDB();
  const query = {};

  // CONSTRUCCIÓN DINÁMICA DE LA CONSULTA:
  // Si el cliente envía 'status' en el Query String, lo adjuntamos al filtro de la base de datos.
  if (status) {
    query.status = status;
  }

  // Si envía 'vacancyId' válido, filtramos dentro del documento embebido.
  if (vacancyId && ObjectId.isValid(vacancyId)) {
    query['vacancy.vacancyId'] = new ObjectId(vacancyId);
  }

  // CADENA DE CURSOR DE MONGODB (Cursor Chaining):
  // 1. '.find(query)': Aplica los filtros de búsqueda.
  // 2. '.sort({ score: -1, createdAt: 1 })': 
  //     - 'score: -1' -> Ordena de mayor a menor puntaje (Descendente).
  //     - 'createdAt: 1' -> En caso de empate en puntaje, prioriza las más antiguas primero (Ascendente).
  // 3. '.toArray()': Ejecuta la consulta y transforma el resultado.
  return await db.collection(COLLECTION_NAME)
    .find(query)
    .sort({ score: -1, createdAt: 1 })
    .toArray();
};

/**
 * Busca una postulación por su ID primario.
 */
export const findApplicationById = async (id) => {
  if (!ObjectId.isValid(id)) return null;
  const db = getDB();
  return await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
};

/**
 * Actualiza el estado de una postulación existente y registra la fecha del cambio.
 */
export const updateApplicationStatus = async (id, newStatus) => {
  const db = getDB();
  const now = new Date();

  // 'findOneAndUpdate' busca el registro y realiza la actualización en una operación atómica.
  // '$set': Modifica únicamente los campos indicados sin sobrescribir el resto del documento.
  // 'returnDocument: "after"': Devuelve la versión final del documento YA actualizado en lugar del previo.
  const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { 
      $set: { 
        status: newStatus,
        statusUpdatedAt: now,
        updatedAt: now
      } 
    },
    { returnDocument: 'after' }
  );

  return result;
};