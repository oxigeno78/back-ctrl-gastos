import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { User } from '../models/User';
import { config } from '../config';
import { logger } from '../utils/logger';

// Inicializar Stripe
const stripe = new Stripe(config.stripe.secretKey);

// Esquemas de validación
const createCheckoutSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
});

const customerPortalSchema = z.object({
  userId: z.string().min(1, 'userId es requerido'),
});

/**
 * Crea una sesión de Stripe Checkout para suscripción mensual.
 * El usuario debe estar registrado previamente.
 */
export const createCheckoutSession = async ( req: Request, res: Response, next: NextFunction ): Promise<void> => {
  try {
    const { userId } = createCheckoutSchema.parse(req.body);

    // Buscar usuario
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    // Si ya tiene suscripción activa, no permitir crear otra
    if (user.subscriptionStatus === 'active') {
      res.status(400).json({
        success: false,
        message: 'El usuario ya tiene una suscripción activa',
      });
      return;
    }

    // Crear o reutilizar cliente de Stripe
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: (user._id as any).toString(),
        },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: config.stripe.priceId,
          quantity: 1,
        },
      ],
      success_url: `${config.frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/subscription/cancel`,
      metadata: {
        userId: (user._id as any).toString(),
      },
      subscription_data: {
        metadata: {
          userId: (user._id as any).toString(),
        },
      },
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors,
      });
      return;
    }
    next(error);
  }
};

/**
 * Webhook de Stripe para procesar eventos de suscripción.
 * IMPORTANTE: Este endpoint debe recibir el body RAW (no parseado como JSON).
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    res.status(400).json({ success: false, message: 'Falta stripe-signature' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // Debe ser el body raw
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    logger.error('Error verificando webhook:', err);
    res.status(400).json({
      success: false,
      message: `Webhook Error: ${(err as Error).message}`,
    });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        logger.debug(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error procesando webhook:', error);
    next(error);
  }
};

/**
 * Maneja el evento checkout.session.completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId;
  if (!userId) {
    logger.error('checkout.session.completed sin userId en metadata');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    logger.error(`Usuario ${userId} no encontrado para checkout completado`);
    return;
  }

  // Actualizar stripeSubscriptionId si está disponible
  if (session.subscription) {
    user.stripeSubscriptionId = session.subscription as string;
    await user.save();
  }

  logger.info(`Checkout completado para usuario ${userId}`);
}

/**
 * Maneja actualizaciones de suscripción
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Intentar buscar por stripeCustomerId
    const user = await User.findOne({ stripeCustomerId: subscription.customer as string });
    if (user) {
      user.stripeSubscriptionId = subscription.id;
      user.subscriptionStatus = subscription.status as any;
      user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
      await user.save();
      logger.info(`Suscripción actualizada para usuario ${user._id}: ${subscription.status}`);
    }
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    logger.error(`Usuario ${userId} no encontrado para actualización de suscripción`);
    return;
  }

  user.stripeSubscriptionId = subscription.id;
  user.subscriptionStatus = subscription.status as any;
  user.subscriptionCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
  await user.save();

  logger.info(`Suscripción actualizada para usuario ${userId}: ${subscription.status}`);
}

/**
 * Maneja cancelación de suscripción
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });
  if (!user) {
    logger.error(`Usuario no encontrado para suscripción eliminada ${subscription.id}`);
    return;
  }

  user.subscriptionStatus = 'canceled';
  user.stripeSubscriptionId = null;
  await user.save();

  logger.info(`Suscripción cancelada para usuario ${user._id}`);
}

/**
 * Maneja fallo de pago
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) {
    logger.error(`Usuario no encontrado para pago fallido, customer: ${customerId}`);
    return;
  }

  user.subscriptionStatus = 'past_due';
  await user.save();

  logger.warn(`Pago fallido para usuario ${user._id}`);
}

/**
 * Crea una sesión del portal de cliente de Stripe.
 * Permite al usuario gestionar su suscripción (cancelar, actualizar método de pago, etc.)
 */
export const createCustomerPortalSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = customerPortalSchema.parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (!user.stripeCustomerId) {
      res.status(400).json({
        success: false,
        message: 'El usuario no tiene una cuenta de Stripe asociada',
      });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${config.frontendUrl}/settings`,
    });

    res.json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.errors,
      });
      return;
    }
    next(error);
  }
};

/**
 * Obtiene el estado de suscripción del usuario
 */
export const getSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      res.status(400).json({ success: false, message: 'userId es requerido' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    // Calcular días restantes
    let daysRemaining = 0;
    if (user.subscriptionCurrentPeriodEnd) {
      const now = new Date();
      const endDate = new Date(user.subscriptionCurrentPeriodEnd);
      const diffTime = endDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    res.json({
      success: true,
      data: {
        hasSubscription: !!user.stripeSubscriptionId,
        status: user.subscriptionStatus,
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
        isActive: user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing',
        isTrial: user.subscriptionStatus === 'trialing',
        daysRemaining,
      },
    });
  } catch (error) {
    next(error);
  }
};
