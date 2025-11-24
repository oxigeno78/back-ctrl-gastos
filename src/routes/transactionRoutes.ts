import { Router } from 'express';
import { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction, getMonthlyStats } from '../controllers/transactionController';
import { authenticateToken } from '../controllers/authController';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de transacciones
router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/:_id', getTransactionById);
router.put('/:_id', updateTransaction);
router.delete('/:_id', deleteTransaction);
router.get('/stats/monthly', getMonthlyStats);

export default router;
