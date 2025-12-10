# Backend API - Control de Gastos

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?logo=mongodb&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-Fargate-FF9900?logo=amazonaws&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)
[![Swagger](https://img.shields.io/badge/Swagger-API%20Docs-85EA2D?logo=swagger&logoColor=black)](https://back-ctrl-gastos-stg.onrender.com/api/v1.0.0/api-docs)

---

## 📋 Resumen Ejecutivo

**Control de Gastos** es una plataforma SaaS de gestión financiera personal diseñada para escalar. Esta API backend proporciona:

- **Modelo de negocio validado**: Sistema de suscripciones con Stripe (trial de 7 días → conversión a pago mensual)
- **Arquitectura production-ready**: Desplegada en AWS Fargate con auto-scaling, WAF y observabilidad completa
- **Experiencia de usuario en tiempo real**: Notificaciones instantáneas vía WebSockets respaldadas por RabbitMQ
- **Seguridad enterprise-grade**: Autenticación con HTTP-only cookies, rate limiting, y secretos gestionados en AWS Secrets Manager
- **MVP en producción:** → [nizerapp.net](https://www.nizerapp.net)

| Métrica | Estado |
|---------|--------|
| **Infraestructura** | AWS Fargate (1 vCPU / 2GB) con auto-scaling |
| **Disponibilidad objetivo** | 99.9% uptime |
| **Seguridad** | WAF + HTTPS + HTTP-only cookies + Secrets Manager |
| **Observabilidad** | CloudWatch Logs + X-Ray Tracing |

---

## 🚀 Stack Tecnológico

| Categoría | Tecnologías |
|-----------|-------------|
| **Runtime** | Node.js 20.x, TypeScript 5.x |
| **Framework** | Express.js, Socket.io |
| **Base de datos** | MongoDB (Mongoose ODM) |
| **Mensajería** | RabbitMQ |
| **Pagos** | Stripe (Checkout, Webhooks, Suscripciones) |
| **Email** | AWS SES, SendGrid, SMTP |
| **Seguridad** | JWT (HTTP-only cookies), bcrypt, Helmet, Zod, Rate Limiting |
| **Infraestructura** | Docker, AWS Fargate, ALB, WAF, ECR, Secrets Manager |
| **Observabilidad** | CloudWatch, X-Ray, Logger personalizado |

## 🎯 Tecnologías Clave y Por Qué

| Tecnología | Decisión Estratégica |
|------------|---------------------|
| **TypeScript** | Reduce bugs en producción ~15%, mejora mantenibilidad y onboarding de nuevos desarrolladores |
| **MongoDB** | Esquema flexible para iterar rápido en features; escalabilidad horizontal nativa con sharding |
| **RabbitMQ** | Desacopla servicios para escalar independientemente; garantiza entrega de notificaciones incluso con picos de tráfico |
| **Socket.io** | UX superior con actualizaciones en tiempo real; reduce polling y carga en servidor |
| **Stripe** | Infraestructura de pagos PCI-compliant sin desarrollo propio; soporte nativo para suscripciones, trials y webhooks |
| **AWS Fargate** | Serverless containers = sin gestión de servidores; pago por uso; auto-scaling automático |
| **AWS WAF** | Protección contra OWASP Top 10 sin código adicional; rate limiting a nivel de infraestructura |
| **HTTP-only Cookies** | Previene XSS token theft (más seguro que localStorage); compatible con SSR y mobile webviews |
| **Zod** | Validación en runtime que complementa TypeScript; mensajes de error claros para el frontend |
| **Docker** | Paridad dev/prod; despliegues reproducibles; facilita CI/CD |

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [📐 Arquitectura](docs/arquitectura.md) | Diagramas de arquitectura, estructura del proyecto, seguridad |
| [📡 API Reference](docs/api.md) | Endpoints, autenticación, ejemplos de uso |
| [🔔 Notificaciones](docs/notificaciones.md) | Sistema de notificaciones en tiempo real con RabbitMQ y WebSockets |
| [💳 Suscripciones](docs/suscripciones.md) | Integración con Stripe, flujos de pago, estados |
| [⏰ Cron Jobs](docs/cron-jobs.md) | Tareas programadas, limpieza de cuentas inactivas |

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

Edita el archivo `.env` con tus valores. Consulta `env.example` para ver todas las variables disponibles.

### 3. Ejecutar la aplicación
```bash
npm run dev
```

## 🔧 Scripts Disponibles

- `npm run dev` - Modo desarrollo con nodemon
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar versión compilada
- `npm test` - Ejecutar tests

## 🚀 Despliegue

| Entorno | Comando |
|---------|--------|
| Desarrollo | `npm run dev` |
| Producción | `npm run build && npm start` |
| Docker | `docker build -t control-gastos-backend . && docker run -p 5000:5000 --env-file .env control-gastos-backend` |
| AWS Fargate | Ver [docs/arquitectura.md](docs/arquitectura.md) |

### Configuración de MongoDB

```env
# Local
MONGO_URI=mongodb://localhost:27017/control-gastos

# Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/control-gastos
```

### Variables de Entorno

Consulta `env.example` para ver todas las variables disponibles. Las principales son:

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default: 5000) |
| `MONGO_URI` | Conexión a MongoDB |
| `JWT_SECRET` | Secreto para tokens JWT |
| `FRONTEND_URL` | URL del frontend (CORS) |
| `RABBITMQ_URL` | Conexión a RabbitMQ |
| `STRIPE_SECRET_KEY` | API key de Stripe |

## �️ Roadmap

| Fase | Features | Estado |
|------|----------|--------|
| **v1.0** | Auth, Transacciones, Categorías, Suscripciones Stripe | ✅ Completado |
| **v1.1** | Notificaciones en tiempo real (RabbitMQ + WebSocket) | ✅ Completado |
| **v1.2** | Despliegue AWS Fargate + WAF + Observabilidad | ✅ Completado |
| **v2.0** | Presupuestos y alertas automáticas | 🔄 En desarrollo |
| **v2.1** | Reportes y exportación (PDF/Excel) | 📋 Planificado |
| **v2.2** | Multi-moneda y tasas de cambio | 📋 Planificado |
| **v3.0** | API pública para integraciones de terceros | 📋 Planificado |

## �📄 Licencia

Todos los derechos reservados.
Este proyecto es software propietario y confidencial.
**UNLICENSED** - No se permite el uso, copia, modificación o distribución sin autorización expresa del autor.

© 2025 NizerApp / Ruben Bautista Mendoza
