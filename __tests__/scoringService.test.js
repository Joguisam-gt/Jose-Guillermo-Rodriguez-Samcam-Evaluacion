import { calculateScoreAndPriority } from '../src/services/scoringService.js';
import { SOURCES, PRIORITIES } from '../src/utils/constants.js';

describe('Motor de Cálculo de Puntaje y Prioridad (scoringService)', () => {

  test('Caso 1: Candidato idóneo con puntaje máximo (Prioridad TOP)', () => {
    // Escenario:
    // +4 pts (Exp 5 >= Min 3)
    // +3 pts (Fuente REFERRAL)
    // +2 pts (Palabras clave "Node", "API" presentes)
    // +1 pt  (Carta > 500 caracteres)
    // 0 pts  (Sin postulaciones externas)
    // Total esperado: 10 pts -> Prioridad TOP
    const longLetter = 'A'.repeat(505) + ' Tengo experiencia en Node y desarrollo de API REST.';

    const result = calculateScoreAndPriority({
      candidateExp: 5,
      minExpRequired: 3,
      source: SOURCES.REFERRAL,
      coverLetter: longLetter,
      activeAppsCountInOtherVacancies: 0
    });

    expect(result.score).toBe(10);
    expect(result.priority).toBe(PRIORITIES.TOP);
  });

  test('Caso 2: Penalización por acaparamiento de postulaciones activas', () => {
    // Escenario:
    // +4 pts (Exp 4 >= Min 2)
    // +0 pts (Fuente JOB_BOARD)
    // +2 pts (Palabra clave "SQL" presente)
    // +0 pts (Carta corta)
    // -2 pts (Tiene 4 postulaciones activas en otras vacantes)
    // Total esperado: 4 pts -> Prioridad MEDIUM
    const result = calculateScoreAndPriority({
      candidateExp: 4,
      minExpRequired: 2,
      source: SOURCES.JOB_BOARD,
      coverLetter: 'Experiencia trabajando con bases de datos SQL.',
      activeAppsCountInOtherVacancies: 4
    });

    expect(result.score).toBe(4);
    expect(result.priority).toBe(PRIORITIES.MEDIUM);
  });

  test('Caso 3: Regla de límite inferior (El puntaje jamás puede ser negativo)', () => {
    // Escenario:
    // +0 pts (Exp 1 < Min 5)
    // +0 pts (Fuente OTHER)
    // +0 pts (Sin palabras clave)
    // +0 pts (Carta corta)
    // -2 pts (Tiene 3 postulaciones activas en otras vacantes)
    // Total calculado: -2 -> Debe ajustarse automáticamente a 0
    const result = calculateScoreAndPriority({
      candidateExp: 1,
      minExpRequired: 5,
      source: SOURCES.OTHER,
      coverLetter: 'Postulación para el puesto.',
      activeAppsCountInOtherVacancies: 3
    });

    expect(result.score).toBe(0);
    expect(result.priority).toBe(PRIORITIES.LOW);
  });

  test('Caso 4: Tolerancia a mayúsculas/minúsculas y evaluación única de palabras clave', () => {
    // Escenario: La carta contiene "NODE", "Sql", "api" múltiples veces.
    // Solo debe sumar +2 pts una única vez, sin importar cuántas coincidencias haya.
    const result = calculateScoreAndPriority({
      candidateExp: 2,
      minExpRequired: 3,
      source: SOURCES.OTHER,
      coverLetter: 'Manejo NODE, Sql y API REST de forma experta.',
      activeAppsCountInOtherVacancies: 0
    });

    expect(result.score).toBe(2);
    expect(result.priority).toBe(PRIORITIES.LOW);
  });

});