import app from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { config } from './config/env.js';

const startServer = async () => {
  try {
    // 1. Conectar a MongoDB antes de levantar el servidor HTTP
    await connectDB();

    // 2. Iniciar el servidor Express escuchando en el puerto configurado
    const server = app.listen(config.port, () => {
      console.log(`[Servidor] Escuchando activamente en el puerto: ${config.port}`);
      console.log(`[Entorno] http://localhost:${config.port}/applications`);
    });

    // MANEJO DE CIERRE CONTROLADO (Graceful Shutdown):
    // Intercepta las señales de interrupción del sistema (ej: Ctrl+C) para cerrar 
    // adecuadamente el pool de conexiones a la base de datos antes de apagar la aplicación.
    const handleShutdown = async (signal) => {
      console.log(`\n[Servidor] Señal ${signal} recibida. Cerrando recursos...`);
      server.close(async () => {
        await closeDB();
        console.log('[Servidor] Apagado completado exitosamente.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (error) {
    console.error('[Servidor] Fallo en la inicialización:', error.message);
    process.exit(1);
  }
};

startServer();