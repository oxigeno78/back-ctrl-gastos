# Usar imagen oficial de Node.js 20.19.5 Alpine
FROM node:20.19.5-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk update && apk add --no-cache dumb-init git

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
#RUN npm ci --only=production && npm cache clean --force
RUN yarn

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN yarn build

# Cambiar ownership de archivos al usuario nodejs
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 5000

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/v1.0.0/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando para iniciar la aplicación
CMD ["dumb-init", "yarn", "start"]
