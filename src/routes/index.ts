import { Router } from 'express';
import authRoutes from './authRoutes';
import transactionRoutes from './transactionRoutes';
import metricsRoutes from './metricsRoutes';

const router = Router();

// Rutas principales
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/metrics', metricsRoutes);

// Ruta de salud
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
