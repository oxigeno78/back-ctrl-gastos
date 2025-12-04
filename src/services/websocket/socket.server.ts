import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import NotificationConsumer from '../consumers/notification.consumer';
import { authInterfaces } from '../../interfaces';
import { config } from '../../config';

const connectedUsers = new Map<string, string>();
let notificationConsumer: NotificationConsumer;

export async function initWebSocketServer(httpServer: any) {
  const io = new Server(httpServer, {
    cors: { origin: config.frontendUrl, credentials: true }
  });

  // Iniciar consumer
  notificationConsumer = new NotificationConsumer(connectedUsers);
  await notificationConsumer.start(io);

  // Autenticación
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as authInterfaces.JWTPayload;
      // console.log('[socket.server|initWebSocketServer - io.use] decoded', decoded);
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    connectedUsers.set(userId, socket.id);
    
    // console.log('[socket.server|initWebSocketServer - io.on] socket.id', socket.id);
    // console.log('[socket.server|initWebSocketServer - io.on] connectedUsers', connectedUsers);
    
    // Suscribir al usuario a su cola de notificaciones
    await notificationConsumer.subscribeUser(userId);

    socket.on('disconnect', async () => {
      connectedUsers.delete(userId);
      await notificationConsumer.unsubscribeUser(userId);
    });
  });

  return io;
}