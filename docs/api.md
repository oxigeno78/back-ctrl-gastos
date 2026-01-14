# 📡 API Reference

> 📚 **Documentación interactiva**: [Swagger UI (Staging)](https://back-ctrl-gastos-stg.onrender.com/api/v1.0.0/api-docs)

## Base URL

```
/api/v1.0.0
```

## Autenticación

> ⚠️ **Nota**: La autenticación usa HTTP-only cookies. El frontend debe incluir `credentials: 'include'` en todas las peticiones.

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Registro de usuario | No |
| `POST` | `/auth/login` | Login (establece cookie HTTP-only) | No |
| `POST` | `/auth/logout` | Cierre de sesión (limpia cookie) | ✅ |
| `GET` | `/auth/me` | Obtener usuario actual | ✅ |
| `GET` | `/auth/verify` | Verificar correo electrónico | No |
| `POST` | `/auth/resend-verification` | Reenviar correo de verificación | No |
| `POST` | `/auth/recover-password` | Solicitar recuperación de contraseña | No |
| `POST` | `/auth/reset-password` | Restablecer contraseña | No |
| `POST` | `/auth/change-password` | Cambiar contraseña (verifica actual) | ✅ |
| `PUT` | `/auth/language` | Cambiar idioma del usuario | ✅ |
| `DELETE` | `/auth/account` | Eliminar cuenta de usuario | ✅ |

## Transacciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/transactions` | Obtener transacciones | ✅ |
| `POST` | `/transactions` | Crear transacción | ✅ |
| `GET` | `/transactions/:_id` | Obtener detalle de una transacción | ✅ |
| `PUT` | `/transactions/:_id` | Actualizar una transacción | ✅ |
| `DELETE` | `/transactions/:_id` | Eliminar una transacción | ✅ |
| `GET` | `/transactions/stats/monthly` | Estadísticas por rango de fechas | ✅ |

### Periodicidad de Transacciones

Las transacciones soportan periodicidad para gastos/ingresos recurrentes:

| Valor | Texto | Descripción |
|-------|-------|-------------|
| 0 | `one-time` | Una sola vez / Desactivado |
| 1 | `daily` | Diario |
| 2 | `weekly` | Semanal |
| 3 | `fortnightly` | Catorcenal |
| 4 | `bi-weekly` | Quincenal |
| 5 | `monthly` | Mensual |
| 6 | `bi-monthly` | Bimestral |
| 7 | `quarterly` | Trimestral |
| 8 | `semi-annual` | Semestral |
| 9 | `yearly` | Anual |
| 10 | `custom` | Personalizado |

La respuesta incluye `periodicityText` con el texto legible de la periodicidad.

## Categorías

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/categories` | Crear categoría | ✅ |
| `GET` | `/categories` | Listar categorías (usuario + sistema) | ✅ |
| `PUT` | `/categories/:_id` | Actualizar categoría de usuario | ✅ |
| `DELETE` | `/categories/:_id` | Eliminar categoría de usuario | ✅ |

## Temas de usuario

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/themes/theme` | Crear tema para el usuario autenticado | ✅ |
| `GET` | `/themes/themes` | Listar todos los temas del usuario | ✅ |
| `PUT` | `/themes/theme/:_id` | Actualizar un tema existente del usuario | ✅ |

## Notificaciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/notifications/:userId` | Obtener notificaciones no leídas | ✅ |
| `PUT` | `/notifications/:userId/:_id` | Marcar notificación como leída | ✅ |
| `PUT` | `/notifications/:userId` | Marcar todas como leídas | ✅ |
| `DELETE` | `/notifications/:userId/:_id` | Eliminar notificación | ✅ |

## Stripe (Suscripciones)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/stripe/create-checkout-session` | Crear sesión de checkout | ✅ |
| `POST` | `/stripe/webhook` | Webhook de Stripe | No* |
| `POST` | `/stripe/customer-portal` | Portal de cliente Stripe | ✅ |
| `GET` | `/stripe/subscription-status/:userId` | Estado de suscripción | ✅ |

> *El webhook usa firma de Stripe para validación.

## Sistema

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `GET` | `/metrics` | Métricas del sistema | No |
| `GET` | `/health` | Estado de la API | No |

## Integración Frontend (HTTP-only Cookies)

```typescript
// OBLIGATORIO: incluir credentials en todas las peticiones
fetch('/api/v1.0.0/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Axios: configuración global
axios.defaults.withCredentials = true;

// Verificar sesión
const user = await fetch('/api/v1.0.0/auth/me', { credentials: 'include' })
  .then(res => res.ok ? res.json().then(d => d.data.user) : null);
```

## Verificación de Correo

### Flujo

1. **Registro**: se crea usuario con `isVerified=false` y se envía correo con link de verificación.
2. **Verificación**: `GET /auth/verify?token=...&email=...` valida el token y activa la cuenta.
3. **Login**: bloqueado con 403 si la cuenta no está verificada.
4. **Reenvío**: `POST /auth/resend-verification` envía un nuevo link.

### Configuración de Email

| Variable | Descripción |
|----------|-------------|
| `EMAIL_PROVIDER` | `smtp`, `ses` o `sendgrid` |
| `MAILER_FROM` | Remitente verificado |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Para SMTP |
| `AWS_REGION` | Para SES |
| `SENDGRID_API_KEY` | Para SendGrid |
