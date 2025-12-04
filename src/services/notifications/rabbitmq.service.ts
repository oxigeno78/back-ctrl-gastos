import amqp, { ChannelModel, Channel } from 'amqplib';
import { config } from '../../config';

class RabbitMQService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly EXCHANGE = 'notifications';

  private isEnabled(): boolean {
    return config.realtime.enabled;
  }

  async connect() {
    if (!this.isEnabled()) {
      console.log('ℹ️ RabbitMQ: Notificaciones en tiempo real deshabilitadas');
      return;
    }

    try {
      console.log('📡 RabbitMQ: Conectando a', config.realtime.rabbitmqUrl);
      this.connection = await amqp.connect(config.realtime.rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      // Exchange tipo 'topic' para permitir wildcard en el consumer
      await this.channel.assertExchange(this.EXCHANGE, 'topic', { durable: true });
      console.log('✅ RabbitMQ Publisher: Conectado y exchange creado');
    } catch (error) {
      console.error('❌ RabbitMQ Publisher: Error al conectar:', error);
      throw error;
    }
  }

  async publishNotification(userId: string, notification: {
    type: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    message?: string;
    titleKey?: string;
    messageKey?: string;
    messageParams?: Record<string, unknown>;
    link?: string;
  }) {
    if (!this.isEnabled()) {
      return; // Silenciosamente ignorar si está deshabilitado
    }

    try {
      if (!this.channel) {
        console.log('📤 RabbitMQ: Canal no existe, conectando...');
        await this.connect();
      }
      
      const payload = {
        ...notification,
        userId,
        createdAt: new Date().toISOString(),
      };

      // Routing key = userId para que cada usuario tenga su cola
      const published = this.channel!.publish(
        this.EXCHANGE,
        userId, // routing key
        Buffer.from(JSON.stringify(payload)),
        { persistent: true } // Garantiza persistencia en disco
      );

      if (published) {
        console.log(`✅ RabbitMQ: Notificación publicada para usuario ${userId}`);
      } else {
        console.warn(`⚠️ RabbitMQ: Buffer lleno, mensaje en espera para usuario ${userId}`);
      }
    } catch (error) {
      console.error('❌ RabbitMQ: Error al publicar notificación:', error);
      throw error;
    }
  }
}

export const rabbitMQService = new RabbitMQService();