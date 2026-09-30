import { SOURCES, PRIORITIES } from '../utils/constants.js';

/**
 * Calcula dinámicamente el puntaje y determina la prioridad de revisión de un candidato.
 * Es una FUNCIÓN PURA: no realiza consultas a la base de datos ni modifica el estado externo; 
 * recibe parámetros de entrada y retorna siempre el mismo resultado predecible.
 * 
 * @param {Object} params - Parámetros de evaluación del perfil.
 * @param {number} params.candidateExp - Años de experiencia del candidato.
 * @param {number} params.minExpRequired - Años mínimos exigidos por la vacante.
 * @param {string} params.source - Fuente de postulación (REFERRAL, INTERNAL, JOB_BOARD, OTHER).
 * @param {string} params.coverLetter - Texto de la carta de presentación.
 * @param {number} params.activeAppsCountInOtherVacancies - Cantidad de postulaciones activas en otras vacantes.
 * 
 * @returns {Object} Objeto con la forma { score: number, priority: string }.
 */
export const calculateScoreAndPriority = ({
  candidateExp,
  minExpRequired,
  source,
  coverLetter,
  activeAppsCountInOtherVacancies
}) => {
  // Inicializamos el acumulador de puntos en cero.
  let score = 0;

  // REGLA 1: Experiencia laboral suficiente
  // Si los años del candidato son mayores o iguales a los exigidos por la vacante, suma +4 puntos.
  if (candidateExp >= minExpRequired) {
    score += 4;
  }

  // REGLA 2: Fuente de la postulación
  // Las postulaciones por recomendación interna (REFERRAL) o empleados actuales (INTERNAL) suman bonificación.
  if (source === SOURCES.REFERRAL) {
    score += 3;
  } else if (source === SOURCES.INTERNAL) {
    score += 2;
  }

  // REGLA 3: Palabras clave en la carta de presentación
  // EXPRESIONES REGULARES (RegEx):
  // \b -> Delimitador de palabra completa (evita falsas coincidencias como 'anode' o 'squeal').
  // (node|sql|api) -> Busca cualquiera de estas tres palabras específicas.
  // /i -> Flag Case-Insensitive: Ignora si está escrito en MAYÚSCULAS o minúsculas.
  const keywordsRegex = /\b(node|sql|api)\b/i;
  
  // .test() devuelve true si encuentra al menos una de las palabras.
  // Importante: La regla exige sumar +2 puntos UNA SOLA VEZ, sin importar cuántas palabras aparezcan.
  if (keywordsRegex.test(coverLetter)) {
    score += 2;
  }

  // REGLA 4: Longitud extensa de la carta de presentación
  // Si el texto supera los 500 caracteres, demuestra mayor interés del candidato y suma +1 punto.
  if (coverLetter.length > 500) {
    score += 1;
  }

  // REGLA 5: Penalización por acaparamiento de postulaciones activas
  // Si el candidato ya se encuentra en proceso activo (RECEIVED o IN_REVIEW) en 3 o más vacantes distintas, 
  // se le descuentan -2 puntos para priorizar candidatos con menor carga activa.
  if (activeAppsCountInOtherVacancies >= 3) {
    score -= 2;
  }

  // CORRECCIÓN MÍNIMA DE SEGURIDAD (Boundary Control):
  // La regla indica que el puntaje total nunca puede ser negativo.
  // Math.max(0, score) garantiza que si el cálculo dio un valor menor que 0 (ej. -2), se devuelva 0.
  score = Math.max(0, score);

  // REGLA DE ASIGNACIÓN DE PRIORIDAD:
  // Según el puntaje numérico acumulado, se clasifica dentro de un Enum estandarizado.
  let priority = PRIORITIES.LOW;

  if (score >= 7) {
    priority = PRIORITIES.TOP;     // 7 o más puntos
  } else if (score >= 5) {
    priority = PRIORITIES.HIGH;    // 5 a 6 puntos
  } else if (score >= 3) {
    priority = PRIORITIES.MEDIUM;  // 3 a 4 puntos
  }

  return { score, priority };
};