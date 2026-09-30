import * as applicationService from '../services/applicationService.js';

/**
 * Manejador HTTP para POST /applications
 * Registra una nueva postulación en la base de datos.
 */
export const createApplication = async (req, res, next) => {
  try {
    const { candidateId, vacancyId, source, coverLetter } = req.body;

    // Delegar la operación a la capa de servicio
    const application = await applicationService.registerApplication({
      candidateId,
      vacancyId,
      source,
      coverLetter
    });

    // Retornar respuesta 201 Created con el recurso creado
    return res.status(201).json(application);
  } catch (error) {
    // Pasar cualquier error lanzado en la capa de servicios al 'errorHandler' global
    next(error);
  }
};

/**
 * Manejador HTTP para GET /applications
 * Obtiene la lista de postulaciones aplicando filtros opcionales (status, vacancyId).
 */
export const getApplications = async (req, res, next) => {
  try {
    // Extraer parámetros de consulta desde req.query (ej: /applications?status=IN_REVIEW&vacancyId=123)
    const { status, vacancyId } = req.query;

    const applications = await applicationService.getApplications({ status, vacancyId });

    return res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

/**
 * Manejador HTTP para PUT /applications/:id/status
 * Actualiza el estado de una postulación.
 */
export const updateApplicationStatus = async (req, res, next) => {
  try {
    // Extraer el parámetro dinámico de la URL (:id)
    const { id } = req.params;
    const { status } = req.body;

    const updatedApplication = await applicationService.updateStatus(id, status);

    return res.status(200).json(updatedApplication);
  } catch (error) {
    next(error);
  }
};