import { MongoClient } from 'mongodb';
import { config } from './env.js';

// PATRÓN SINGLETON (Variables de ámbito de módulo):
// Mantenemos una única referencia en memoria para el cliente y la instancia de la base de datos.
// Esto evita crear múltiples conexiones TCP innecesarias en cada petición HTTP, reutilizando el 'Connection Pool'.
let dbInstance = null;
let clientInstance = null;

/**
 * Inicializa y abre el pool de conexiones con el cluster/servidor de MongoDB.
 * @returns {Promise<Db>} Instancia de la base de datos conectada.
 */
export const connectDB = async () => {
  // GUARD CLAUSE (Retorno temprano):
  // Si la conexión ya fue creada previamente por otra petición, reutilizamos la instancia existente.
  if (dbInstance) return dbInstance;

  try {
    // Instanciamos el cliente nativo con la URI de conexión (ej. mongodb://127.0.0.1:27017)
    clientInstance = new MongoClient(config.mongoUri);

    // Conectamos el cliente al servidor físico o contenedor de MongoDB
    await clientInstance.connect();

    // Seleccionamos la base de datos mediante el nombre configurado en las variables de entorno
    dbInstance = clientInstance.db(config.dbName);

    console.log(`[MongoDB] Conexión establecida con éxito en la base de datos: ${config.dbName}`);
    return dbInstance;
  } catch (error) {
    console.error('[MongoDB] Error al conectar con la base de datos:', error.message);
    // Si la base de datos falla al iniciar, interrumpimos el proceso de Node.js (Código 1) para evitar incoherencias
    process.exit(1);
  }
};

/**
 * Proporciona acceso a la instancia activa de la base de datos en los repositorios.
 * Es una función síncrona que retorna la referencia que ya fue conectada al iniciar la aplicación.
 * @returns {Db} Instancia activa de MongoDB.
 */
export const getDB = () => {
  if (!dbInstance) {
    throw new Error('Base de datos no inicializada. Debe ejecutar connectDB() antes de realizar consultas.');
  }
  return dbInstance;
};

/**
 * Cierra la conexión de red de forma segura cuando el servidor de Express se apaga (Graceful Shutdown).
 */
export const closeDB = async () => {
  if (clientInstance) {
    await clientInstance.close();
    dbInstance = null;
    clientInstance = null;
    console.log('[MongoDB] Pool de conexiones cerrado exitosamente.');
  }
};