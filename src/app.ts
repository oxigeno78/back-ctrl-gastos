import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { requestLogger, apiRateLimit, corsErrorHandler } from './middlewares/rateLimiting';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
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

// Rutas principales
app.use('/api/v1.0.0', routes);

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware centralizado de manejo de errores
app.use(errorHandler);

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
