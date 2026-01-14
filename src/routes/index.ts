import { Router } from 'express';
import authRoutes from './authRoutes';
import transactionRoutes from './transactionRoutes';
import metricsRoutes from './metricsRoutes';
import categoriesRoutes from './categoriesRoutes';
import notificationsRoutes from './notificationsRoutes';
import stripeRoutes from './stripeRoutes';
import themesRoutes from './themesRoutes';

const router = Router();

// Rutas principales
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/metrics', metricsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/themes', themesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/stripe', stripeRoutes);

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
