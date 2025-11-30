import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { requestLogger, apiRateLimit, corsErrorHandler } from './middlewares/rateLimiting';
import { swaggerSpec } from './swagger';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares de seguridad
app.use(helmet());

// Configuración de CORS para permitir múltiples orígenes
const allowedOrigins = [
  `http://localhost:${process.env.PORT || 5000}`,
  process.env.FRONTEND_URL
].filter(Boolean); // Eliminar valores undefined

app.set('trust proxy', true);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origen bloqueado - ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 horas
}));

// Middlewares de logging y rate limiting
app.use(morgan('combined'));
app.use(requestLogger);
app.use(apiRateLimit);

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para manejar errores de CORS
app.use(corsErrorHandler);

// Documentación Swagger
const apiBasePath = process.env.API_BASE_PATH || '/api/v1.0.0';
const apiDocsPath = process.env.API_DOCS_PATH || '/api-docs';
app.use(
  apiBasePath+apiDocsPath,
  swaggerUi.serve as unknown as express.RequestHandler[],
  swaggerUi.setup(swaggerSpec) as unknown as express.RequestHandler
);

// Rutas principales
app.use(apiBasePath, routes);

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware centralizado de manejo de errores
app.use(errorHandler);

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI no está definida en las variables de entorno');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido, cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});

export { connectDB };
export default app;
