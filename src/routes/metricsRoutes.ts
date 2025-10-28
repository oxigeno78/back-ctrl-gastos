import { Router } from 'express';
import { getMetrics } from '../controllers/metricsController';

const router = Router();

// Ruta de métricas (pública para monitoreo)
router.get('/', getMetrics);

export default router;
