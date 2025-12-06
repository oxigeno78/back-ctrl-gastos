# Backend API - Control de Gastos

API REST desarrollada con Express.js, TypeScript y MongoDB para el sistema de control de gastos personal.

## 🚀 Características

- **Express.js** con TypeScript estricto
- **MongoDB** con Mongoose ODM
- **RabbitMQ** para sistema de notificaciones en tiempo real
- **WebSockets** (Socket.io) para comunicación bidireccional
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **Zod** para validación de datos
- **Swagger/OpenAPI** para documentación interactiva
- **Stripe** para suscripciones y pagos
- Arquitectura limpia con principios SOLID
- Middleware centralizado para errores y logs
- Rate limiting y seguridad con Helmet
- Dockerización completa

## 📋 Requisitos Previos

- Node.js 20.19.5
- MongoDB (local o Atlas)
- RabbitMQ (para notificaciones en tiempo real)
- npm o yarn

## 🛠️ Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp env.example .env
```

Editar `.env`:
```env
MONGO_URI=mongodb+srv://user:pass@cluster/db
JWT_SECRET=supersecretkey
PORT=5000
NODE_ENV=development
JWT_EXPIRES_IN=7d
RECAPTCHA_SECRET_KEY=xxx

# RabbitMQ (notificaciones en tiempo real)
ENABLE_REALTIME_NOTIFICATIONS=true
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Frontend y base de API
FRONTEND_URL=http://localhost:3000
API_URL_BASE=http://localhost
API_BASE_PATH=/api/v1.0.0

# Proveedor de email: smtp | ses | sendgrid
EMAIL_PROVIDER=ses
MAILER_FROM=noreply@example.com

# Configuración SES (si EMAIL_PROVIDER=ses)
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=

# Configuración SendGrid (si EMAIL_PROVIDER=sendgrid)
SENDGRID_API_KEY=

# Configuración SMTP (si EMAIL_PROVIDER=smtp)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=

# Stripe (suscripciones)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx
```

### 3. Ejecutar la aplicación

#### Desarrollo
```bash
npm run dev
```

#### Producción
```bash
npm run build
npm start
```

## 🐳 Docker

### Construir imagen
```bash
docker build -t control-gastos-backend .
```

### Ejecutar contenedor
```bash
docker run -p 5000:5000 --env-file .env control-gastos-backend
```

## 📡 API Endpoints

### Autenticación
 - `POST /api/v1.0.0/auth/register` - Registro de usuario
 - `POST /api/v1.0.0/auth/login` - Login de usuario
 - `POST /api/v1.0.0/auth/logout` - Cierre de sesión (requiere auth)
 - `GET /api/v1.0.0/auth/verify` - Verificar correo electrónico
 - `POST /api/v1.0.0/auth/resend-verification` - Reenviar correo de verificación
 - `POST /api/v1.0.0/auth/recover-password` - Solicitar recuperación de contraseña
 - `POST /api/v1.0.0/auth/reset-password` - Restablecer contraseña
 - `POST /api/v1.0.0/auth/change-password` - Cambiar contraseña (requiere auth)
 - `PUT /api/v1.0.0/auth/language` - Cambiar idioma del usuario (requiere auth)
 - `DELETE /api/v1.0.0/auth/account` - Eliminar cuenta de usuario (requiere auth)

### Transacciones
 - `GET /api/v1.0.0/transactions` - Obtener transacciones (requiere auth)
 - `POST /api/v1.0.0/transactions` - Crear transacción (requiere auth)
 - `GET /api/v1.0.0/transactions/:_id` - Obtener detalle de una transacción (requiere auth)
 - `PUT /api/v1.0.0/transactions/:_id` - Actualizar una transacción (requiere auth)
 - `DELETE /api/v1.0.0/transactions/:_id` - Eliminar una transacción (requiere auth)
 - `GET /api/v1.0.0/transactions/stats/monthly` - Estadísticas mensuales (requiere auth)

#### Periodicidad de Transacciones

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

### Categorías
- `POST /api/v1.0.0/categories/categories` - Crear categoría (requiere auth)
- `GET /api/v1.0.0/categories/categories` - Listar categorías (usuario + sistema) (requiere auth)
- `PUT /api/v1.0.0/categories/categories/:_id` - Actualizar categoría de usuario (requiere auth)
- `DELETE /api/v1.0.0/categories/categories/:_id` - Eliminar categoría de usuario (requiere auth)

### Notificaciones
- `POST /api/v1.0.0/notifications/:userId` - Obtener notificaciones no leídas (requiere auth)
- `PUT /api/v1.0.0/notifications/:userId/:_id` - Marcar notificación como leída (requiere auth)
- `PUT /api/v1.0.0/notifications/:userId` - Marcar todas las notificaciones como leídas (requiere auth)
- `DELETE /api/v1.0.0/notifications/:userId/:_id` - Eliminar notificación (requiere auth)

### Stripe (Suscripciones)
- `POST /api/v1.0.0/stripe/create-checkout-session` - Crear sesión de checkout (requiere auth)
- `POST /api/v1.0.0/stripe/webhook` - Webhook de Stripe (sin auth, usa firma)
- `POST /api/v1.0.0/stripe/customer-portal` - Portal de cliente Stripe (requiere auth)
- `GET /api/v1.0.0/stripe/subscription-status/:userId` - Estado de suscripción (requiere auth)

### Métricas
- `GET /api/v1.0.0/metrics` - Métricas del sistema (público)

### Health Check
- `GET /api/v1.0.0/health` - Estado de la API

### Documentación
- `GET /api-docs` - Documentación Swagger UI interactiva

## ✉️ Verificación de correo

- **Flujo**
  - **Registro**: se crea usuario con `isVerified=false` y se envía correo con link de verificación.
  - **Verificación**: `GET {API_URL_BASE}{API_BASE_PATH}/auth/verify?token=...&email=...` valida el token y activa la cuenta.
  - **Login**: bloqueado con 403 si la cuenta no está verificada.
  - **Reenvío**: `POST .../auth/resend-verification` envía un nuevo link.

- **Configuración**
  - `EMAIL_PROVIDER`: `smtp` (por defecto) o `ses` (AWS SES nativo).
  - `MAILER_FROM`: remitente verificado en tu proveedor.
  - Si `smtp` (incluye SES vía SMTP): `SMTP_HOST`, `SMTP_PORT` (465/587), `SMTP_USER`, `SMTP_PASS`.
  - Si `ses` (SDK nativo): `AWS_REGION` y credenciales IAM por variables o rol.

- **Notas**
  - En sandbox de SES, solo puedes enviar a/desde identidades verificadas.
  - Configura SPF/DKIM/DMARC en tu dominio para mejor entregabilidad.

## 💳 Sistema de Suscripciones (Stripe)

El sistema utiliza Stripe Checkout para gestionar suscripciones mensuales.

### Período de Prueba Gratuito

- **Todos los nuevos usuarios reciben automáticamente 7 días de prueba gratuita** al registrarse.
- Durante el período de prueba, el usuario tiene acceso completo a todas las funciones.
- El estado de suscripción será `trialing` durante este período.
- Al finalizar el período de prueba, el usuario deberá completar el pago para continuar usando el servicio.

### Política de Cuentas Inactivas

El sistema ejecuta automáticamente un job de limpieza diario (3:00 AM) que elimina cuentas inactivas:

- **Cuentas con suscripción cancelada/incompleta/impaga** por más de 30 días.
- **Cuentas con período de prueba expirado** hace más de 30 días sin suscripción activa.
- **Cuentas sin verificar email** por más de 30 días.

> ⚠️ Los usuarios pueden reactivar su cuenta iniciando una nueva suscripción antes de que se cumpla el plazo de 30 días.

### Flujo de Suscripción

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

### Endpoints

#### POST `/stripe/create-checkout-session`
Crea una sesión de Stripe Checkout para iniciar el pago.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "userId": "string"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_xxx",
    "url": "https://checkout.stripe.com/..."
  }
}
```

#### POST `/stripe/webhook`
Recibe eventos de Stripe (checkout completado, suscripción actualizada, pago fallido, etc.).

**Headers:** `stripe-signature: <firma>`

**Eventos manejados:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

#### POST `/stripe/customer-portal`
Genera URL al portal de Stripe donde el usuario puede gestionar su suscripción.

**Body:**
```json
{
  "userId": "string"
}
```

#### GET `/stripe/subscription-status/:userId`
Obtiene el estado actual de la suscripción.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "hasSubscription": false,
    "status": "trialing",
    "currentPeriodEnd": "2025-01-11T00:00:00.000Z",
    "isActive": true,
    "isTrial": true,
    "daysRemaining": 7
  }
}
```

### Configuración en Stripe Dashboard

1. Crear un **Producto** con un **Precio** recurrente mensual
2. Copiar el `price_id` (ej: `price_1ABC...`) a `STRIPE_PRICE_ID`
3. Configurar el webhook apuntando a `https://tu-dominio.com/api/v1.0.0/stripe/webhook`
4. Seleccionar eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
5. Copiar el webhook secret a `STRIPE_WEBHOOK_SECRET`

### Estados de Suscripción

| Estado | Descripción |
|--------|-------------|
| `incomplete` | Pago pendiente |
| `active` | Suscripción activa |
| `past_due` | Pago atrasado |
| `canceled` | Cancelada |
| `unpaid` | Sin pagar |
| `trialing` | En período de prueba |
| `paused` | Pausada |

## 🔔 Sistema de Notificaciones

El sistema de notificaciones utiliza RabbitMQ como broker de mensajes y WebSockets (Socket.io) para comunicación en tiempo real.

### Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Acción     │────▶│  Publisher  │────▶│    RabbitMQ      │────▶│  Consumer   │
│ (ej: crear  │     │  (rabbitmq  │     │  Exchange:       │     │ (guarda en  │
│ transacción)│     │  .service)  │     │  notifications   │     │  MongoDB)   │
└─────────────┘     └─────────────┘     └──────────────────┘     └──────┬──────┘
                                                                        │
                                                                        ▼
                                                               ┌────────────────┐
                                                               │ ¿Usuario       │
                                                               │ conectado?     │
                                                               └───────┬────────┘
                                                                       │
                                                    ┌──────────────────┴──────────────────┐
                                                    │                                     │
                                                    ▼                                     ▼
                                           ┌───────────────┐                    ┌─────────────────┐
                                           │ SÍ: Enviar    │                    │ NO: Guardar en  │
                                           │ por WebSocket │                    │ MongoDB (leerá  │
                                           └───────────────┘                    │ al reconectarse)│
                                                                                └─────────────────┘
```

### Flujo de Notificaciones

1. **Evento disparador**: Una acción (crear transacción, alerta de presupuesto, etc.) genera una notificación
2. **Publisher**: Publica el mensaje al exchange `notifications` de RabbitMQ
3. **Consumer**: Procesa el mensaje y lo guarda en MongoDB
4. **Entrega**:
   - **Usuario online**: Se envía inmediatamente por WebSocket
   - **Usuario offline**: Se almacena en MongoDB, disponible vía API REST

### Conexión WebSocket (Frontend)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'JWT_TOKEN' },
  transports: ['websocket', 'polling'],
});

// Escuchar notificaciones
socket.on('notification', (notification) => {
  console.log('Nueva notificación:', notification);
});
```

### Estructura de Notificación

```typescript
{
  _id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  // Soporte para i18n
  titleKey?: string;
  messageKey?: string;
  messageParams?: Record<string, unknown>;
  // O texto directo
  title?: string;
  message?: string;
  link?: string;
  read: boolean;
  deleted: boolean;
  createdAt: Date;
}
```

### Configuración RabbitMQ

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

Para desarrollo local con Docker:
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Acceso a la consola de administración: `http://localhost:15672` (usuario: `guest`, contraseña: `guest`)

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/          # Controladores de rutas
│   │   ├── authController.ts
│   │   ├── transactionController.ts
│   │   ├── notificationsController.ts
│   │   ├── metricsController.ts
│   │   ├── CategoriesController.ts
│   │   └── stripeController.ts
│   ├── interfaces/           # Interfaces TypeScript
│   │   ├── auth.interfaces.ts
│   │   ├── user.interfaces.ts
│   │   ├── transaction.interfaces.ts
│   │   ├── notifications.interface.ts
│   │   ├── categories.interfaces.ts
│   │   ├── error.interfaces.ts
│   │   └── index.ts
│   ├── models/               # Modelos de MongoDB
│   │   ├── User.ts
│   │   ├── Transaction.ts
│   │   ├── Notification.ts
│   │   └── Categorys.ts
│   ├── routes/               # Definición de rutas
│   │   ├── authRoutes.ts
│   │   ├── transactionRoutes.ts
│   │   ├── notificationsRoutes.ts
│   │   ├── metricsRoutes.ts
│   │   ├── categoriesRoutes.ts
│   │   ├── stripeRoutes.ts
│   │   └── index.ts
│   ├── services/             # Lógica de negocio
│   │   ├── notifications/    # Servicios de notificaciones
│   │   │   ├── rabbitmq.service.ts    # Publisher RabbitMQ
│   │   │   └── notification.service.ts # Servicio de alto nivel
│   │   ├── consumers/        # Consumidores de mensajes
│   │   │   └── notification.consumer.ts
│   │   └── websocket/        # WebSocket server
│   │       └── socket.server.ts
│   ├── middlewares/          # Middlewares personalizados
│   │   ├── errorHandler.ts
│   │   └── rateLimiting.ts
│   ├── config/               # Configuración centralizada
│   │   ├── env.config.ts     # Variables de entorno
│   │   └── index.ts
│   ├── utils/                # Utilidades
│   ├── app.ts                # Configuración de Express
│   ├── swagger.ts            # Configuración de Swagger/OpenAPI
│   └── server.ts             # Punto de entrada
├── Dockerfile                # Imagen Docker
├── .dockerignore             # Archivos a ignorar en Docker
├── env.example               # Variables de entorno de ejemplo
├── package.json
└── tsconfig.json
```

## 🔧 Scripts Disponibles

- `npm run dev` - Modo desarrollo con nodemon
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar versión compilada
- `npm test` - Ejecutar tests

## 🎨 Tecnologías Utilizadas

- Node.js 20.19.5
- Express.js
- TypeScript
- MongoDB
- Mongoose
- RabbitMQ (amqplib)
- Socket.io
- JWT
- bcryptjs
- Zod
- Nodemailer
- AWS SES (@aws-sdk/client-sesv2)
- SendGrid (@sendgrid/mail)
- Google reCAPTCHA
- CORS
- Helmet
- Morgan
- Express Rate Limit
- Swagger UI Express
- Swagger JSDoc
- Stripe

## 🔒 Seguridad

- Autenticación JWT con expiración configurable
- Hash de contraseñas con bcrypt
- Rate limiting para prevenir ataques
- Validación estricta de datos con Zod
- Headers de seguridad con Helmet
- CORS configurado correctamente
- Middleware de manejo de errores centralizado

## 📈 Monitoreo

El endpoint `/api/v1.0.0/metrics` proporciona:
- Tiempo de actividad del servidor
- Uso de memoria
- Información del sistema
- Estado de la base de datos
- Métricas de CPU y red

## 🚀 Despliegue

### Desarrollo Local
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t control-gastos-backend .
docker run -p 5000:5000 control-gastos-backend
```

## 🔧 Configuración de MongoDB

### Opción 1: MongoDB Local
```env
MONGO_URI=mongodb://localhost:27017/control-gastos
```

### Opción 2: MongoDB Atlas
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/control-gastos
```

## 🆘 Solución de Problemas

### Error de conexión a MongoDB
- Verifica que MongoDB esté ejecutándose
- Revisa la cadena de conexión en `.env`
- Asegúrate de que la base de datos sea accesible

### Error de compilación TypeScript
- Verifica que todas las dependencias estén instaladas
- Revisa la configuración en `tsconfig.json`
- Ejecuta `npm run build` para ver errores específicos

### Problemas de autenticación
- Verifica que `JWT_SECRET` esté configurado
- Revisa que el token no haya expirado
- Asegúrate de que el middleware de autenticación esté funcionando

### Error de conexión a RabbitMQ
- Verifica que RabbitMQ esté ejecutándose: `docker ps` o `systemctl status rabbitmq-server`
- Revisa la variable `RABBITMQ_URL` en `.env`
- Si cambiaste el tipo de exchange, elimínalo primero desde la consola de administración (`http://localhost:15672`)

### Notificaciones no llegan
- Verifica que el consumer esté conectado (busca en logs: `✅ NotificationConsumer: Conectado`)
- Revisa que el usuario esté conectado por WebSocket para recibir en tiempo real
- Las notificaciones offline se obtienen vía API REST: `POST /api/v1.0.0/notifications/:userId`

## 📚 Documentación API (Swagger)

La API cuenta con documentación interactiva generada con Swagger/OpenAPI 3.0.

### Acceso
- **URL**: `http://localhost:5000/api-docs`
- **Formato**: OpenAPI 3.0

### Características
- Documentación completa de todos los endpoints
- Esquemas de request/response
- Autenticación JWT integrada (Bearer Token)
- Ejemplos de uso para cada endpoint
- Posibilidad de probar endpoints directamente desde la interfaz

### Configuración
Las rutas de documentación se configuran mediante variables de entorno:
```env
API_DOCS_PATH=/api-docs
```

## 📄 Licencia

Todos los derechos reservados.
Este proyecto es software propietario y confidencial.

**UNLICENSED** - No se permite el uso, copia, modificación o distribución sin autorización expresa del autor.

© 2025 NizerApp / Ruben Bautista Mendoza
