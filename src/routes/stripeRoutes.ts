import { Router } from 'express';
import {
  createCheckoutSession,
  handleWebhook,
  createCustomerPortalSession,
  getSubscriptionStatus,
} from '../controllers/stripeController';
import { authenticateToken } from '../controllers/authController';

const router = Router();

/**
 * POST /stripe/create-checkout-session
 * Crea una sesión de Stripe Checkout para suscripción mensual.
 * Requiere autenticación.
 */
router.post('/create-checkout-session', authenticateToken, createCheckoutSession);

/**
 * POST /stripe/webhook
 * Webhook de Stripe para procesar eventos.
 * El body raw se maneja en app.ts antes del JSON parser.
 * Esta ruta NO debe tener autenticación JWT.
 */
router.post('/webhook', handleWebhook);

/**
 * POST /stripe/customer-portal
 * Crea una sesión del portal de cliente de Stripe.
 * Requiere autenticación.
 */
router.post('/customer-portal', authenticateToken, createCustomerPortalSession);

/**
 * GET /stripe/subscription-status/:userId
 * Obtiene el estado de suscripción del usuario.
 * Requiere autenticación.
 */
router.get('/subscription-status/:userId', authenticateToken, getSubscriptionStatus);

export default router;
