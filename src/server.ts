import app, { connectDB } from './app';

const PORT = process.env.PORT || 5000;
const apiBaseUrl = process.env.API_URL_BASE || `http://localhost:${process.env.PORT || 5000}`;
const apiBasePath = process.env.API_BASE_PATH || '/api/v1.0.0';

// Conectar a la base de datos y iniciar servidor
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📊 Métricas disponibles en ${apiBaseUrl}${apiBasePath}/metrics`);
      console.log(`🔍 Health check en ${apiBaseUrl}${apiBasePath}/health`);
    });
  } catch (error) {
    console.error('Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();
