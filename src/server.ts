import { createServer } from 'http';
import app, { connectDB } from './app';
import { initWebSocketServer } from './services/websocket/socket.server';
import { config, validateEnv } from './config';
import { logger } from './utils/logger';

const environment = process.env.NODE_ENV || 'development';
// Crear servidor HTTP para Express y Socket.io
const httpServer = createServer(app);

// Conectar a la base de datos y iniciar servidor
const startServer = async () => {
  try {
    // Validar variables de entorno antes de iniciar
    validateEnv();
    
    await connectDB();
    
    // Inicializar WebSocket server solo si está habilitado
    if (config.realtime.enabled) {
      await initWebSocketServer(httpServer);
    }
    
    httpServer.listen(config.port, () => {
      logger.info(environment);
      logger.info(`🚀 Servidor ejecutándose en puerto ${config.port}`);
      if (config.realtime.enabled) {
        logger.info(`🔌 WebSocket disponible en ws://${config.apiHostName}:${config.port}/socket.io/`);
      } else {
        logger.info(`ℹ️ Notificaciones en tiempo real deshabilitadas`);
      }
      logger.info(`📊 Métricas disponibles en ${config.apiUrlBase}:${config.port}${config.apiBasePath}/metrics`);
      logger.info(`🔍 Health check en ${config.apiUrlBase}:${config.port}${config.apiBasePath}/health`);
    });
  } catch (error) {
    logger.error('Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();
