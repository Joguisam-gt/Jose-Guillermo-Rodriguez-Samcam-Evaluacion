import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

// Nombre exacto de la colección dentro de MongoDB
const COLLECTION_NAME = 'candidates';

/**
 * Busca un candidato por su identificador único (_id).
 * @param {string} id - ID en formato de texto plano (24 caracteres Hex) enviado por el cliente.
 * @returns {Promise<Object|null>} Documento del candidato o null si no existe/ID inválido.
 */
export const findCandidateById = async (id) => {
  // VALIDACIÓN PREVIA (Guard Clause):
  // MongoDB no entiende IDs como texto plano ("12345"); usa el tipo de dato nativo 'ObjectId'.
  // Si la cadena no cumple el formato hexadecimal de 24 caracteres, 'ObjectId.isValid' retorna false.
  // Esto evita que la consulta falle arrojando una excepción no controlada en la base de datos.
  if (!ObjectId.isValid(id)) return null;

  // CONEXIÓN A LA BASE DE DATOS:
  // 'getDB()' obtiene la instancia activa del pool de conexiones creado al iniciar el servidor (Singleton).
  const db = getDB();

  // EJECUCIÓN DE LA CONSULTA:
  // 'db.collection()' selecciona la colección y '.findOne()' busca el primer documento que coincida.
  // Instanciamos 'new ObjectId(id)' para que MongoDB compare tipos de datos compatibles.
  return await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
};

/**
 * Busca un candidato por su dirección de correo electrónico.
 * @param {string} email - Correo del candidato.
 * @returns {Promise<Object|null>} Documento del candidato si se encuentra.
 */
export const findCandidateByEmail = async (email) => {
  const db = getDB();
  
  // Normalizamos el correo a minúsculas (.toLowerCase()) antes de consultar 
  // para evitar duplicados por diferencias entre mayúsculas y minúsculas (Ej: Test@Mail.com vs test@mail.com).
  return await db.collection(COLLECTION_NAME).findOne({ email: email.toLowerCase() });
};