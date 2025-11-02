# Backend API - Control de Gastos

API REST desarrollada con Express.js, TypeScript y MongoDB para el sistema de control de gastos personal.

## 🚀 Características

- **Express.js** con TypeScript estricto
- **MongoDB** con Mongoose ODM
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **Zod** para validación de datos
- Arquitectura limpia con principios SOLID
- Middleware centralizado para errores y logs
- Rate limiting y seguridad con Helmet
- Dockerización completa

## 📋 Requisitos Previos

- Node.js 20.19.5
- MongoDB (local o Atlas)
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

# Frontend y base de API
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:5000
API_BASE_PATH=/api/v1.0.0

# Proveedor de email: smtp | ses
EMAIL_PROVIDER=ses
MAILER_FROM=noreply@example.com

# Configuración SES (si EMAIL_PROVIDER=ses)
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=

# Configuración SMTP (si EMAIL_PROVIDER=smtp)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
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
- `GET /api/v1.0.0/auth/verify` - Verificar correo electrónico
- `POST /api/v1.0.0/auth/resend-verification` - Reenviar correo de verificación

### Transacciones
- `GET /api/v1.0.0/transactions` - Obtener transacciones (requiere auth)
- `POST /api/v1.0.0/transactions` - Crear transacción (requiere auth)
- `GET /api/v1.0.0/transactions/stats/monthly` - Estadísticas mensuales (requiere auth)

### Métricas
- `GET /api/v1.0.0/metrics` - Métricas del sistema (público)

### Health Check
- `GET /api/v1.0.0/health` - Estado de la API

## ✉️ Verificación de correo

- **Flujo**
  - **Registro**: se crea usuario con `isVerified=false` y se envía correo con link de verificación.
  - **Verificación**: `GET {APP_URL}{API_BASE_PATH}/auth/verify?token=...&email=...` valida el token y activa la cuenta.
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

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/     # Controladores de rutas
│   │   ├── authController.ts
│   │   ├── transactionController.ts
│   │   └── metricsController.ts
│   ├── models/          # Modelos de MongoDB
│   │   ├── User.ts
│   │   └── Transaction.ts
│   ├── routes/          # Definición de rutas
│   │   ├── authRoutes.ts
│   │   ├── transactionRoutes.ts
│   │   ├── metricsRoutes.ts
│   │   └── index.ts
│   ├── services/        # Lógica de negocio
│   ├── middlewares/     # Middlewares personalizados
│   │   ├── errorHandler.ts
│   │   └── rateLimiting.ts
│   ├── utils/           # Utilidades
│   ├── app.ts           # Configuración de Express
│   └── server.ts         # Punto de entrada
├── Dockerfile           # Imagen Docker
├── .dockerignore        # Archivos a ignorar en Docker
├── env.example          # Variables de entorno de ejemplo
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
- JWT
- bcryptjs
- Zod
- CORS
- Helmet
- Morgan
- Express Rate Limit

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
