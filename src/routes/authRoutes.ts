import { Router } from 'express';
import { register, login, verifyEmail, resendVerification } from '../controllers/authController';

const router = Router();

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyEmail);
router.post('/resend-verification', resendVerification);

export default router;
