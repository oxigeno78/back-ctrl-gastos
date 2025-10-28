import { Router } from 'express';
import { createTransaction, getTransactions, getMonthlyStats } from '../controllers/transactionController';
import { authenticateToken } from '../controllers/authController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de transacciones
router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/stats/monthly', getMonthlyStats);

export default router;
