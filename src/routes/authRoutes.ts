import { Router } from 'express';
import { register, login, logout, verifyEmail, resendVerification, recoveryUserPassword, resetPassword, authenticateToken, deleteAccount, changePassword, changeLanguage, getCurrentUser, updateCurrency } from '../controllers/authController';

const router = Router();

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/verify', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/recover-password', recoveryUserPassword);
router.post('/reset-password', resetPassword);

// Rutas protegidas
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePassword);
router.put('/language', authenticateToken, changeLanguage);
router.put('/currency', authenticateToken, updateCurrency);
router.delete('/account', authenticateToken, deleteAccount);

export default router;
