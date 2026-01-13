import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Cargar variables de entorno
dotenv.config();

logger.debug("SES ENV CHECK", {
  region: process.env.AWS_REGION,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
});

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
  apiHostName: process.env.API_HOST_NAME || 'localhost',

  // Notificaciones en tiempo real
  realtime: {
    enabled: process.env.ENABLE_REALTIME_NOTIFICATIONS === 'true',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },

  // Email
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    from: process.env.MAILER_FROM || '',
    debug: process.env.MAILER_DEBUG === 'true',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
    },
    ses: {
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
    }
  },

  // AWS
  aws: {
    region: process.env.AWS_REGION || 'us-east-1'
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    priceId: process.env.STRIPE_PRICE_ID || '', // ID del precio de suscripción mensual
  },

  // Cookies
  cookie: {
    secret: process.env.COOKIE_SECRET || process.env.JWT_SECRET || '',
    name: process.env.COOKIE_NAME || 'auth_token',
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800000', 10), // 7 días en ms
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: (process.env.COOKIE_SAME_SITE || 'strict') as 'strict' | 'lax' | 'none',
    domain: process.env.COOKIE_DOMAIN || undefined,
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

  // Validar Stripe (usar console.warn aquí porque logger aún no está disponible)
  if (!config.stripe.secretKey) {
    const now = new Date();
    const offset = -now.getTimezoneOffset() / 60;
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} UTC${offset >= 0 ? '+' : ''}${offset}`;
    const fileName = 'env.config.ts'.padEnd(20);
    console.warn(`\x1b[90m[ ${ts} | \x1b[35m${fileName}\x1b[90m ]\x1b[0m \x1b[33m\x1b[1mWARN   \x1b[0m\x1b[33m: ⚠️ STRIPE_SECRET_KEY no está configurado. Las suscripciones no funcionarán.\x1b[0m`);
  }
}

export default config;
