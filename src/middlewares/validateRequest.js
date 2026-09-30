import { ALLOWED_SOURCES, ALLOWED_APPLICATION_STATUSES } from '../utils/constants.js';

/**
 * Valida los campos obligatorios y sus tipos de datos antes de permitir que la petición
 * llegue a la capa de controladores en la ruta POST /applications.
 * 
 * En Express, un Middleware es una función intermediaria que tiene acceso a:
 * - 'req' (request): La petición HTTP entrante.
 * - 'res' (response): La respuesta HTTP enviada al cliente.
 * - 'next': Una función especial que le indica a Express que todo está bien y puede pasar al siguiente handler.
 */
export const validateCreateApplication = (req, res, next) => {
  const { candidateId, vacancyId, source, coverLetter } = req.body;

  // 1. Verificación de presencia de campos requeridos
  if (!candidateId || !vacancyId || !source || !coverLetter) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Datos incompletos. Se requieren obligatoriamente: candidateId, vacancyId, source y coverLetter.',
        timestamp: new Date().toISOString()
      }
    });
  }

  // 2. Validación de valores permitidos (Enum) para la fuente de postulación
  if (!ALLOWED_SOURCES.includes(source)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_SOURCE',
        message: `La fuente '${source}' no es válida. Valores permitidos: ${ALLOWED_SOURCES.join(', ')}.`,
        timestamp: new Date().toISOString()
      }
    });
  }

  // 3. Validación de tipo para la carta de presentación
  if (typeof coverLetter !== 'string' || coverLetter.trim().length === 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_COVER_LETTER',
        message: 'La carta de presentación (coverLetter) debe ser un texto válido y no puede estar vacía.',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Si todas las validaciones son exitosas, pasamos el control al siguiente middleware o controlador.
  next();
};

/**
 * Valida los datos requeridos para la actualización de estado en PUT /applications/:id/status.
 */
export const validateUpdateStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'El campo status es obligatorio.',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Verificar que el estado enviado pertenezca al catálogo permitido
  if (!ALLOWED_APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_STATUS',
        message: `El estado '${status}' no es permitido. Valores aceptados: ${ALLOWED_APPLICATION_STATUSES.join(', ')}.`,
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};