# 💳 Sistema de Suscripciones (Stripe)

El sistema utiliza Stripe Checkout para gestionar suscripciones mensuales.

## Período de Prueba Gratuito

- **Todos los nuevos usuarios reciben automáticamente 7 días de prueba gratuita** al registrarse.
- Durante el período de prueba, el usuario tiene acceso completo a todas las funciones.
- El estado de suscripción será `trialing` durante este período.
- Al finalizar el período de prueba, el usuario deberá completar el pago para continuar usando el servicio.

## Flujo de Suscripción

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  Usuario    │────▶│  POST /stripe/      │────▶│  Stripe         │
│  registrado │     │  create-checkout-   │     │  Checkout       │
│             │     │  session            │     │  (pago)         │
└─────────────┘     └─────────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  Usuario    │◀────│  Actualizar estado  │◀────│  Webhook        │
│  con        │     │  subscriptionStatus │     │  /stripe/       │
│  suscripción│     │  en MongoDB         │     │  webhook        │
└─────────────┘     └─────────────────────┘     └─────────────────┘
```

## Configuración en Stripe Dashboard

1. Crear un **Producto** con un **Precio** recurrente mensual
2. Copiar el `price_id` (ej: `price_1ABC...`) a `STRIPE_PRICE_ID`
3. Configurar el webhook apuntando a `https://tu-dominio.com/api/v1.0.0/stripe/webhook`
4. Seleccionar eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
5. Copiar el webhook secret a `STRIPE_WEBHOOK_SECRET`

## Variables de Entorno

```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx
```

## Estados de Suscripción

| Estado | Descripción |
|--------|-------------|
| `incomplete` | Pago pendiente |
| `active` | Suscripción activa |
| `past_due` | Pago atrasado |
| `canceled` | Cancelada |
| `unpaid` | Sin pagar |
| `trialing` | En período de prueba |
| `paused` | Pausada |

## Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/stripe/create-checkout-session` | Crear sesión de checkout | ✅ |
| `POST` | `/stripe/webhook` | Webhook de Stripe | No* |
| `POST` | `/stripe/customer-portal` | Portal de cliente Stripe | ✅ |
| `GET` | `/stripe/subscription-status/:userId` | Estado de suscripción | ✅ |

> *El webhook usa firma de Stripe para validación.
