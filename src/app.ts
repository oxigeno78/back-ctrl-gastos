import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import path from 'path';
import favicon from 'serve-favicon';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { requestLogger, apiRateLimit, corsErrorHandler } from './middlewares/rateLimiting';
import { swaggerSpec } from './swagger';
import { config } from './config';
import { startCleanupJob } from './jobs';
import { logger } from './utils/logger';

const app = express();

// Favicon
app.use(favicon(path.join(__dirname, '../public', 'favicon.png')) as unknown as express.RequestHandler);

// Middlewares de seguridad
app.use(helmet());

// Configuración de CORS para permitir múltiples orígenes
const allowedOrigins = [
  `http://localhost:${config.port}`,
  'https://www.nizerapp.net',
  'http://nizerapp.net',
  config.frontendUrl
].filter(Boolean); // Eliminar valores undefined

app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Origen bloqueado - ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 horas
}));

// Cookie parser (antes de las rutas)
app.use(cookieParser(config.cookie.secret));

// Middlewares de logging y rate limiting
// Morgan deshabilitado - usamos requestLogger con logger personalizado
// app.use(morgan('combined'));
app.use(requestLogger);
app.use(apiRateLimit);

// Stripe webhook necesita el body raw ANTES de express.json()
// Por eso usamos una función condicional
app.use((req, res, next) => {
  if (req.originalUrl === `${config.apiBasePath}/stripe/webhook`) {
    // Para el webhook de Stripe, usar raw body
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    // Para el resto de rutas, usar JSON parser normal
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para manejar errores de CORS
app.use(corsErrorHandler);

// Documentación Swagger
app.use(
  config.apiBasePath + '/api-docs',
  swaggerUi.serve as unknown as express.RequestHandler[],
  swaggerUi.setup(swaggerSpec) as unknown as express.RequestHandler
);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'API funcionando correctamente' });
});

// Rutas principales
app.use(config.apiBasePath, routes);

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware centralizado de manejo de errores
app.use(errorHandler);

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    logger.info(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

// Iniciar jobs programados
const cleanupJob = startCleanupJob();

export { connectDB, cleanupJob };
export default app;
