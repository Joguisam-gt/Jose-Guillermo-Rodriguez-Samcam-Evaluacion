import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Protege los endpoints administrativos o restrictivos (ej. cambio de estado de postulaciones).
 * Verifica que el cliente envíe un token JWT válido en la cabecera 'Authorization'.
 */
export const authenticateToken = (req, res, next) => {
  // Las peticiones HTTP que requieren autenticación deben enviar el encabezado:
  // Authorization: Bearer <TOKEN_JWT>
  const authHeader = req.headers['authorization'];
  
  // Extraemos el token separándolo por el espacio ('Bearer KEY' -> 'KEY')
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Acceso denegado: Token de autenticación ausente en el encabezado Authorization.',
        timestamp: new Date().toISOString()
      }
    });
  }

  // 'jwt.verify' comprueba la validez matemática de la firma del token utilizando la clave secreta del entorno
  jwt.verify(token, config.jwtSecret, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Token inválido o expirado.',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Adjuntamos la información del usuario desencriptada a 'req.user' para que los controladores la tengan disponible
    req.user = decodedUser;
    next();
  });
};