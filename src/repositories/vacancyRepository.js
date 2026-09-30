import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

const COLLECTION_NAME = 'vacancies';

/**
 * Consulta la existencia y detalles de una vacante laboral.
 * @param {string} id - ID de la vacante enviado en la petición HTTP.
 * @returns {Promise<Object|null>} Documento de la vacante con su estado ('OPEN'/'CLOSED').
 */
export const findVacancyById = async (id) => {
  // Comprobación de seguridad sobre la estructura del ObjectId
  if (!ObjectId.isValid(id)) return null;

  const db = getDB();

  // Retorna el objeto directo con campos como { title, minYearsOfExperience, status }
  return await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
};