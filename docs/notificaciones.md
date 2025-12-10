# 🔔 Sistema de Notificaciones

El sistema de notificaciones utiliza RabbitMQ como broker de mensajes y WebSockets (Socket.io) para comunicación en tiempo real.

## Arquitectura

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

## Flujo de Notificaciones

1. **Evento disparador**: Una acción (crear transacción, alerta de presupuesto, etc.) genera una notificación
2. **Publisher**: Publica el mensaje al exchange `notifications` de RabbitMQ
3. **Consumer**: Procesa el mensaje y lo guarda en MongoDB
4. **Entrega**:
   - **Usuario online**: Se envía inmediatamente por WebSocket
   - **Usuario offline**: Se almacena en MongoDB, disponible vía API REST

## Conexión WebSocket (Frontend)

El WebSocket soporta autenticación mediante **HTTP-only cookies** (recomendado) o token manual:

```typescript
import { io } from 'socket.io-client';

// Opción 1: HTTP-only cookies (recomendado)
// El navegador envía automáticamente la cookie de sesión
const socket = io('http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

// Opción 2: Token manual (fallback para clientes sin soporte de cookies)
const socket = io('http://localhost:5000', {
  auth: { token: 'JWT_TOKEN' },
  transports: ['websocket', 'polling'],
});

// Escuchar notificaciones
socket.on('notification', (notification) => {
  console.log('Nueva notificación:', notification);
});
```

> 💡 **Nota**: Si el usuario ya tiene sesión iniciada con HTTP-only cookies, solo necesita `withCredentials: true`. El servidor intentará primero leer la cookie y, si no existe, usará el token del `auth`.

## Estructura de Notificación

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

## Configuración RabbitMQ

```env
ENABLE_REALTIME_NOTIFICATIONS=true
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

### Desarrollo local con Docker

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Acceso a la consola de administración: `http://localhost:15672` (usuario: `guest`, contraseña: `guest`)

## Solución de Problemas

### Notificaciones no llegan

1. Verifica que el consumer esté conectado (busca en logs: `✅ NotificationConsumer: Conectado`)
2. Revisa que el usuario esté conectado por WebSocket para recibir en tiempo real
3. Las notificaciones offline se obtienen vía API REST: `POST /api/v1.0.0/notifications/:userId`

### Error de conexión a RabbitMQ

1. Verifica que RabbitMQ esté ejecutándose: `docker ps` o `systemctl status rabbitmq-server`
2. Revisa la variable `RABBITMQ_URL` en `.env`
3. Si cambiaste el tipo de exchange, elimínalo primero desde la consola de administración
