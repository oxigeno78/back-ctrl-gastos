import amqp, { Channel, ConsumeMessage, ChannelModel } from 'amqplib';
import { Server } from 'socket.io';
import { Notification } from '../../models/Notification';
import { notificationsInterfaces } from '../../interfaces';
import { config } from '../../config';

class NotificationConsumer {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private io: Server | null = null;
  private connectedUsers: Map<string, string>; // userId -> socketId
  
  private readonly EXCHANGE = 'notifications';
  private readonly QUEUE = 'notifications.processor';
  private readonly RETRY_DELAY = 5000;

  constructor(connectedUsers: Map<string, string>) {
    this.connectedUsers = connectedUsers;
  }

  async start(io: Server) {
    this.io = io;
    await this.connect();
  }

  private async connect() {
    try {
      console.log('📡 NotificationConsumer: Conectando a RabbitMQ...');
      this.connection = await amqp.connect(config.realtime.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Exchange tipo 'topic' para poder usar wildcard '#' y capturar todos los mensajes
      await this.channel.assertExchange(this.EXCHANGE, 'topic', { durable: true });

      // Cola central que procesa TODAS las notificaciones
      await this.channel.assertQueue(this.QUEUE, {
        durable: true,
        arguments: {
          'x-message-ttl': 7 * 24 * 60 * 60 * 1000, // 7 días TTL
          'x-dead-letter-exchange': 'notifications.dlx',
        },
      });

      // Bind con '#' para capturar TODOS los mensajes del exchange
      await this.channel.bindQueue(this.QUEUE, this.EXCHANGE, '#');

      // Dead Letter Exchange para mensajes fallidos
      await this.channel.assertExchange('notifications.dlx', 'direct', { durable: true });
      await this.channel.assertQueue('notifications.failed', { durable: true });
      await this.channel.bindQueue('notifications.failed', 'notifications.dlx', '');

      // Comenzar a consumir mensajes
      await this.channel.consume(this.QUEUE, async (msg) => {
        if (msg) {
          await this.handleMessage(msg);
        }
      });

      console.log('✅ NotificationConsumer: Conectado y escuchando mensajes');

      // Manejar cierre de conexión
      this.connection.on('close', () => {
        console.log('⚠️ RabbitMQ connection closed, reconnecting...');
        setTimeout(() => this.connect(), this.RETRY_DELAY);
      });

      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err);
      });

    } catch (error) {
      console.error('❌ NotificationConsumer: Error al conectar:', error);
      setTimeout(() => this.connect(), this.RETRY_DELAY);
    }
  }

  /**
   * Procesar mensaje recibido - SIEMPRE guarda en MongoDB
   */
  private async handleMessage(msg: ConsumeMessage) {
    try {
      const payload: notificationsInterfaces.INotificationPayload = JSON.parse(msg.content.toString());
      const { userId } = payload;
      
      console.log(`📨 Procesando notificación para usuario: ${userId}`);

      // SIEMPRE guardar en MongoDB primero
      const savedNotification = await Notification.create({
        userId,
        type: payload.type,
        titleKey: payload.titleKey,
        messageKey: payload.messageKey,
        title: payload.title,
        message: payload.message,
        messageParams: payload.messageParams,
        link: payload.link,
        read: false,
        deleted: false,
      });

      // Verificar si el usuario está conectado por WebSocket
      const socketId = this.connectedUsers.get(userId);

      if (socketId && this.io) {
        // Usuario online: enviar por WebSocket
        this.io.to(socketId).emit('notification', {
          _id: savedNotification._id.toString(),
          type: payload.type,
          titleKey: payload.titleKey,
          messageKey: payload.messageKey,
          title: payload.title,
          message: payload.message,
          messageParams: payload.messageParams,
          link: payload.link,
          read: false,
          createdAt: savedNotification.createdAt,
        });
        console.log(`✅ Notificación enviada por WebSocket a usuario ${userId}`);
      } else {
        console.log(`💾 Notificación guardada para usuario offline ${userId}`);
      }

      // ACK: mensaje procesado exitosamente
      this.channel?.ack(msg);

    } catch (error) {
      console.error('❌ Error procesando notificación:', error);
      // NACK sin requeue - irá al Dead Letter Exchange
      this.channel?.nack(msg, false, false);
    }
  }

  /**
   * Registrar usuario conectado (para envío en tiempo real)
   */
  async subscribeUser(userId: string) {
    console.log(`📬 Usuario ${userId} conectado, recibirá notificaciones en tiempo real`);
  }

  /**
   * Usuario desconectado (las notificaciones se seguirán guardando en MongoDB)
   */
  async unsubscribeUser(userId: string) {
    console.log(`📭 Usuario ${userId} desconectado, notificaciones se guardarán en MongoDB`);
  }

  /**
   * Cerrar conexión
   */
  async close() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.log('NotificationConsumer closed');
    } catch (error) {
      console.error('Error closing NotificationConsumer:', error);
    }
  }
}

export default NotificationConsumer;