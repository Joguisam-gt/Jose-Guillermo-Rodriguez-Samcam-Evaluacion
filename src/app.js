import express from 'express';
import applicationRoutes from './routes/applicationRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// MIDDLEWARE PARSER DE JSON:
// Habilita a Express para interpretar cuerpos de solicitud HTTP enviados en formato JSON (req.body).
app.use(express.json());

// REGISTRO DE RUTAS:
// Todas las rutas definidas en 'applicationRoutes' responderán bajo el prefijo '/applications'.
app.use('/applications', applicationRoutes);

// MANEJO DE RUTAS NO ENCONTRADAS (404 Fallback):
// Si una petición HTTP llega a una URL no definida en las rutas anteriores, responderá con este error.
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `La ruta solicitada [${req.method}] ${req.originalUrl} no existe en la API.`,
      timestamp: new Date().toISOString()
    }
  });
});

// MIDDLEWARE GLOBAL DE ERRORES:
// Captura cualquier excepción imprevista lanzada con 'next(error)' en los controladores o middlewares.
app.use(errorHandler);

export default app;