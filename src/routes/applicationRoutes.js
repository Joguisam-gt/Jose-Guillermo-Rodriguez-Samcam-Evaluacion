import { Router } from 'express';
import {
  createApplication,
  getApplications,
  updateApplicationStatus
} from '../controllers/applicationController.js';
import {
  validateCreateApplication,
  validateUpdateStatus
} from '../middlewares/validateRequest.js';
import { authenticateToken } from '../middlewares/auth.js';

// 'Router()' nos permite crear un módulo de rutas independiente y modular.
const router = Router();

/**
 * @route   POST /applications
 * @desc    Registra una nueva postulación en el sistema.
 * @access  Público
 * @middlewares 
 *   - validateCreateApplication: Verifica que el body contenga candidateId, vacancyId, source y coverLetter.
 */
router.post('/', validateCreateApplication, createApplication);

/**
 * @route   GET /applications
 * @desc    Obtiene postulaciones ordenadas por puntaje y fecha, con filtros opcionales (status, vacancyId).
 * @access  Público
 */
router.get('/', getApplications);

/**
 * @route   PUT /applications/:id/status
 * @desc    Actualiza el estado de una postulación (RECEIVED, IN_REVIEW, REJECTED, HIRED).
 * @access  Protegido (Requiere encabezado Authorization con Bearer Token JWT)
 * @middlewares 
 *   - authenticateToken: Valida el JWT del reclutador.
 *   - validateUpdateStatus: Comprueba que el nuevo estado enviado en el body sea permitido.
 */
router.put('/:id/status', authenticateToken, validateUpdateStatus, updateApplicationStatus);

export default router;