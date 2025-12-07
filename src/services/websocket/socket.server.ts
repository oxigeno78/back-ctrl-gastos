import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import NotificationConsumer from '../consumers/notification.consumer';
import { authInterfaces } from '../../interfaces';
import { config } from '../../config';
import { logger } from '../../utils';

const connectedUsers = new Map<string, string>();
let notificationConsumer: NotificationConsumer;

/**
 * Extrae el token JWT de las cookies del handshake o del auth
 */
function extractToken(socket: any): string | null {
  // 1. Intentar obtener de HTTP-only cookie
  const cookieHeader = socket.handshake.headers.cookie;
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader);
    const cookieToken = cookies[config.cookie.name];
    if (cookieToken) {
      // logger.debug('WebSocket: Token obtenido de HTTP-only cookie');
      return cookieToken;
    }
  }
  
  // 2. Fallback: obtener del auth (para clientes que no soportan cookies)
  const authToken = socket.handshake.auth?.token;
  if (authToken) {
    logger.debug('WebSocket: Token obtenido de handshake.auth');
    return authToken;
  }
  
  return null;
}

export async function initWebSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: { origin: config.frontendUrl, credentials: true }
  });

  // Iniciar consumer
  notificationConsumer = new NotificationConsumer(connectedUsers);
  await notificationConsumer.start(io);

  // Autenticación con soporte para HTTP-only cookies
  io.use((socket, next) => {
    const token = extractToken(socket);
    
    if (!token) {
      logger.warn('WebSocket: No se encontró token de autenticación');
      return next(new Error('Unauthorized'));
    }
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as authInterfaces.JWTPayload;
      // logger.debug('WebSocket: Usuario autenticado:', decoded.userId);
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      logger.warn('WebSocket: Token inválido o expirado');
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    connectedUsers.set(userId, socket.id);

    logger.info('[initWebSocketServer - io.on] userId: ', userId, ' socket.id: ', socket.id);
    
    // Suscribir al usuario a su cola de notificaciones
    await notificationConsumer.subscribeUser(userId);

    socket.on('disconnect', async () => {
      connectedUsers.delete(userId);
      await notificationConsumer.unsubscribeUser(userId);
      logger.info('[initWebSocketServer - io.on] socket.id: ', socket.id, ' userId: ', userId);
    });
  });

  return io;
}
