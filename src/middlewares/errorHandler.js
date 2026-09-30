/**
 * Capturador global de excepciones en Express.
 * Firma requerida en Express para middlewares de error: DEBE tener exactamente 4 parámetros (err, req, res, next).
 * Al pasarle 'err' como primer argumento, Express redirige automáticamente cualquier error ejecutado con 'next(error)' aquí.
 */
export const errorHandler = (err, req, res, next) => {
    // Si el error trae asignado un código de estado (statusCode) definido en los servicios, lo respetamos.
    // De lo contrario, asignamos un error genérico 500 (Internal Server Error).
    const statusCode = err.statusCode || 500;
  
    // Registrar el error en la consola del servidor para propósitos de depuración (debugging)
    console.error(`[Error Handler] [${req.method} ${req.url}]:`, err.message);
  
    // Devolver siempre un esquema normalizado JSON al cliente
    res.status(statusCode).json({
      error: {
        code: err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'APPLICATION_ERROR'),
        message: err.message || 'Ocurrió un error inesperado en el servidor.',
        timestamp: new Date().toISOString()
      }
    });
  };