import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

/**
 * Configuración centralizada de variables de entorno.
 * Todas las variables se validan y sanean aquí.
 */
export const config = {
  // Servidor
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',

  // Base de datos
  mongoUri: process.env.MONGO_URI || '',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // reCAPTCHA
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY || '',

  // URLs
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiUrlBase: process.env.API_URL_BASE || 'http://localhost',
  apiBasePath: process.env.API_BASE_PATH || '/api/v1.0.0',

  // Notificaciones en tiempo real
  realtime: {
    enabled: process.env.ENABLE_REALTIME_NOTIFICATIONS === 'true',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },

  // Email
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    from: process.env.MAILER_FROM || '',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
    },
  },

  // AWS
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    priceId: process.env.STRIPE_PRICE_ID || '', // ID del precio de suscripción mensual
  },
} as const;

/**
 * Valida que las variables de entorno requeridas estén presentes.
 * Lanza error si falta alguna crítica.
 */
export function validateEnv(): void {
  const required: { key: string; value: string }[] = [
    { key: 'MONGO_URI', value: config.mongoUri },
    { key: 'JWT_SECRET', value: config.jwt.secret },
  ];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    const keys = missing.map(({ key }) => key).join(', ');
    throw new Error(`❌ Variables de entorno requeridas no definidas: ${keys}`);
  }

  // Validar RabbitMQ solo si las notificaciones están habilitadas
  if (config.realtime.enabled && !config.realtime.rabbitmqUrl) {
    throw new Error('❌ RABBITMQ_URL es requerido cuando ENABLE_REALTIME_NOTIFICATIONS=true');
  }

  // Validar Stripe
  if (!config.stripe.secretKey) {
    console.warn('⚠️ STRIPE_SECRET_KEY no está configurado. Las suscripciones no funcionarán.');
  }
}

export default config;
