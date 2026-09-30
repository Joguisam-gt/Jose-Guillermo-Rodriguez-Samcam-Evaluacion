import * as candidateRepository from '../repositories/candidateRepository.js';
import * as vacancyRepository from '../repositories/vacancyRepository.js';
import * as applicationRepository from '../repositories/applicationRepository.js';
import { calculateScoreAndPriority } from './scoringService.js';
import { APPLICATION_STATUS, VACANCY_STATUS, FINAL_STATUSES } from '../utils/constants.js';

/**
 * Procesa y registra una nueva postulación en el sistema aplicando todas las validaciones de negocio.
 */
export const registerApplication = async ({ candidateId, vacancyId, source, coverLetter }) => {
  // PASO 1: Verificar que la vacante exista en la base de datos
  const vacancy = await vacancyRepository.findVacancyById(vacancyId);
  if (!vacancy) {
    const error = new Error('La vacante especificada no existe.');
    error.statusCode = 404; // Código HTTP 404: Not Found
    throw error;
  }

  // PASO 2: Verificar que la vacante esté abierta para recibir solicitudes
  if (vacancy.status !== VACANCY_STATUS.OPEN) {
    const error = new Error('No es posible postularse: La vacante se encuentra cerrada.');
    error.statusCode = 400; // Código HTTP 400: Bad Request
    throw error;
  }

  // PASO 3: Verificar que el candidato exista en el sistema
  const candidate = await candidateRepository.findCandidateById(candidateId);
  if (!candidate) {
    const error = new Error('El candidato especificado no existe.');
    error.statusCode = 404;
    throw error;
  }

  // PASO 4: Aplicar la Regla de Duplicidad
  // Consultamos todas las postulaciones históricas de este candidato a esta vacante en particular.
  const previousApplications = await applicationRepository.findApplicationsByCandidateAndVacancy(
    candidateId,
    vacancyId
  );

  for (const app of previousApplications) {
    // Escenario A: Posee una postulación en curso (RECEIVED, IN_REVIEW) o ya fue contratado (HIRED).
    if ([APPLICATION_STATUS.RECEIVED, APPLICATION_STATUS.IN_REVIEW, APPLICATION_STATUS.HIRED].includes(app.status)) {
      const error = new Error(
        `El candidato ya tiene una postulación activa o finalizada (${app.status}) para esta vacante.`
      );
      error.statusCode = 409; // Código HTTP 409: Conflict (Conflicto por duplicidad)
      throw error;
    }

    // Escenario B: Fue rechazado previamente (REJECTED) en esta vacante.
    if (app.status === APPLICATION_STATUS.REJECTED) {
      // Calculamos el tiempo transcurrido desde la fecha exacta de rechazo (statusUpdatedAt).
      const now = new Date();
      const rejectionDate = new Date(app.statusUpdatedAt);
      
      // Diferencia en milisegundos convertida a días: (ms / (1000 * 60 * 60 * 24))
      const diffInTime = now.getTime() - rejectionDate.getTime();
      const daysSinceRejection = diffInTime / (1000 * 3600 * 24);

      // Si han pasado menos de 30 días, se bloquea la solicitud y se informan los días faltantes.
      if (daysSinceRejection < 30) {
        const remainingDays = Math.ceil(30 - daysSinceRejection);
        const error = new Error(
          `Postulación rechazada recientemente. Debe esperar ${remainingDays} día(s) adicional(es) para volver a aplicar.`
        );
        error.statusCode = 409;
        throw error;
      }
    }
  }

  // PASO 5: Consultar la cantidad de postulaciones activas en OTRAS vacantes
  // Este dato es necesario para calcular la penalización de la Regla 5 del motor de scoring.
  const activeAppsCountInOtherVacancies = await applicationRepository.countActiveApplicationsInOtherVacancies(
    candidateId,
    vacancyId
  );

  // PASO 6: Delegar el cálculo automático de puntaje y prioridad al servicio especializado
  const { score, priority } = calculateScoreAndPriority({
    candidateExp: candidate.yearsOfExperience,
    minExpRequired: vacancy.minYearsOfExperience,
    source,
    coverLetter,
    activeAppsCountInOtherVacancies
  });

  // PASO 7: Construir el documento final con datos desnormalizados y persistir en la BD
  const applicationData = {
    candidate: {
      candidateId: candidate._id,
      name: candidate.name,
      email: candidate.email,
      yearsOfExperience: candidate.yearsOfExperience
    },
    vacancy: {
      vacancyId: vacancy._id,
      title: vacancy.title,
      minYearsOfExperience: vacancy.minYearsOfExperience
    },
    source,
    coverLetter,
    score,
    priority
  };

  return await applicationRepository.createApplication(applicationData);
};

/**
 * Consulta las postulaciones registradas permitiendo filtros opcionales.
 */
export const getApplications = async (filters) => {
  return await applicationRepository.findAllApplications(filters);
};

/**
 * Actualiza el estado de una postulación existente validando las restricciones de cambio de estado.
 */
export const updateStatus = async (id, newStatus) => {
  // PASO 1: Verificar que la postulación exista en la base de datos
  const application = await applicationRepository.findApplicationById(id);
  if (!application) {
    const error = new Error('La postulación especificada no fue encontrada.');
    error.statusCode = 404;
    throw error;
  }

  // PASO 2: Validar estados finales e inmutabilidad
  // Si la postulación ya se encuentra en estado REJECTED o HIRED, no se permite ningún cambio posterior.
  if (FINAL_STATUSES.includes(application.status)) {
    const error = new Error(
      `Operación no permitida: La postulación ya se encuentra en un estado final (${application.status}) y no puede ser modificada.`
    );
    error.statusCode = 400;
    throw error;
  }

  // PASO 3: Ejecutar la actualización en la base de datos
  return await applicationRepository.updateApplicationStatus(id, newStatus);
};