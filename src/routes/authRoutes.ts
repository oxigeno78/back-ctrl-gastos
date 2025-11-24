import { Router } from 'express';
import { register, login, logout, verifyEmail, resendVerification, recoveryUserPassword, resetPassword } from '../controllers/authController';

const router = Router();

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/recover-password', recoveryUserPassword);
router.post('/reset-password', resetPassword);

export default router;
