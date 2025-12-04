import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './config';

const apiBasePath = config.apiBasePath;
const apiBaseUrl = config.apiUrlBase;

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Control de Gastos - API',
      version: '1.0.0',
      description: 'Documentación de la API REST para el sistema de control de gastos personales.',
      contact: {
        name: 'Soporte',
      },
    },
    servers: [
      {
        url: `${apiBaseUrl}${apiBasePath}`,
        description: 'Servidor principal',
      },
    ],
    tags: [
      { name: 'Health', description: 'Estado de la API' },
      { name: 'Auth', description: 'Autenticación y gestión de usuarios' },
      { name: 'Transactions', description: 'Gestión de transacciones (ingresos/gastos)' },
      { name: 'Categories', description: 'Gestión de categorías' },
      { name: 'Notifications', description: 'Sistema de notificaciones' },
      { name: 'Metrics', description: 'Métricas del sistema' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido en el login',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
            isVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            amount: { type: 'number', minimum: 0.01, example: 150.50 },
            category: { type: 'string', maxLength: 50, example: 'Alimentación' },
            description: { type: 'string', maxLength: 200, example: 'Compra en supermercado' },
            date: { type: 'string', format: 'date-time' },
            deleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TransactionInput: {
          type: 'object',
          required: ['type', 'amount', 'category', 'description'],
          properties: {
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            amount: { type: 'number', minimum: 0.01, example: 150.50 },
            category: { type: 'string', maxLength: 50, example: 'Alimentación' },
            description: { type: 'string', maxLength: 200, example: 'Compra en supermercado' },
            date: { type: 'string', format: 'date-time', description: 'Opcional, por defecto fecha actual' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', maxLength: 50, example: 'Alimentación' },
            type: { type: 'string', enum: ['system', 'user'], example: 'user' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            transactionType: { type: 'string', enum: ['income', 'expense'], example: 'expense', description: 'Tipo de transacción asociada a la categoría' },
            description: { type: 'string', maxLength: 200, example: 'Gastos de comida y supermercado' },
            color: { type: 'string', maxLength: 7, example: '#FF5733' },
            deleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CategoryInput: {
          type: 'object',
          required: ['name', 'type', 'transactionType', 'description', 'color'],
          properties: {
            name: { type: 'string', maxLength: 50, example: 'Entretenimiento' },
            type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
            transactionType: { type: 'string', enum: ['income', 'expense'], example: 'expense', description: 'Tipo de transacción asociada a la categoría' },
            description: { type: 'string', maxLength: 200, example: 'Gastos de ocio y diversión' },
            color: { type: 'string', maxLength: 7, example: '#3498DB' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            type: { type: 'string', enum: ['info', 'success', 'warning', 'error'], example: 'success' },
            title: { type: 'string', example: 'Transacción creada', description: 'Título directo (opcional si usa i18n)' },
            message: { type: 'string', example: 'Se ha registrado un ingreso de $500', description: 'Mensaje directo (opcional si usa i18n)' },
            titleKey: { type: 'string', example: 'notifications.messages.transactionCreatedTitle', description: 'Clave i18n para el título' },
            messageKey: { type: 'string', example: 'notifications.messages.transactionCreatedMessage', description: 'Clave i18n para el mensaje' },
            messageParams: { type: 'object', example: { type: 'income', amount: 500 }, description: 'Parámetros para interpolación i18n' },
            link: { type: 'string', example: '/dashboard/transactions', description: 'Enlace de acción' },
            read: { type: 'boolean', example: false },
            deleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Metrics: {
          type: 'object',
          properties: {
            uptime: { type: 'integer', description: 'Tiempo de actividad en segundos' },
            memoryUsageMB: { type: 'number', description: 'Uso de memoria en MB' },
            memoryUsagePercent: { type: 'integer', description: 'Porcentaje de memoria usada' },
            system: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                arch: { type: 'string' },
                hostname: { type: 'string' },
                totalMemoryMB: { type: 'integer' },
                freeMemoryMB: { type: 'integer' },
                cpuCount: { type: 'integer' },
                cpuModel: { type: 'string' },
              },
            },
            app: {
              type: 'object',
              properties: {
                nodeVersion: { type: 'string' },
                pid: { type: 'integer' },
                environment: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
            dbStatus: { type: 'string' },
          },
        },
      },
    },
    paths: {
      // Health
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Estado de la API',
          description: 'Verifica que la API esté funcionando correctamente',
          security: [],
          responses: {
            200: {
              description: 'API funcionando',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'API funcionando correctamente' },
                      timestamp: { type: 'string', format: 'date-time' },
                      version: { type: 'string', example: '1.0.0' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      // Auth - Register
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Registrar nuevo usuario',
          description: 'Crea una nueva cuenta de usuario. Requiere verificación por email.',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password', 'recaptchaToken'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 50, example: 'Juan Pérez' },
                    email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
                    password: { type: 'string', minLength: 6, example: 'miContraseña123' },
                    recaptchaToken: { type: 'string', description: 'Token de reCAPTCHA v3' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Usuario registrado exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Usuario registrado exitosamente. Revisa tu correo para confirmar tu cuenta.' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Datos inválidos o usuario ya existe' },
          },
        },
      },
      // Auth - Login
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          description: 'Autentica un usuario y devuelve un token JWT',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'recaptchaToken'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
                    password: { type: 'string', example: 'miContraseña123' },
                    recaptchaToken: { type: 'string', description: 'Token de reCAPTCHA v3' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login exitoso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Login exitoso' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string', description: 'Token JWT' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Credenciales inválidas' },
            403: { description: 'Cuenta no verificada' },
          },
        },
      },
      // Auth - Logout
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Cerrar sesión',
          description: 'Registra el cierre de sesión del usuario',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Logout exitoso',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
          },
        },
      },
      // Auth - Verify Email
      '/auth/verify': {
        get: {
          tags: ['Auth'],
          summary: 'Verificar email',
          description: 'Verifica el email del usuario mediante el token enviado por correo',
          security: [],
          parameters: [
            { name: 'token', in: 'query', required: true, schema: { type: 'string' }, description: 'Token de verificación' },
            { name: 'email', in: 'query', required: true, schema: { type: 'string', format: 'email' }, description: 'Email del usuario' },
          ],
          responses: {
            200: { description: 'Email verificado exitosamente' },
            302: { description: 'Redirección al frontend tras verificación exitosa' },
            400: { description: 'Token inválido o expirado' },
          },
        },
      },
      // Auth - Resend Verification
      '/auth/resend-verification': {
        post: {
          tags: ['Auth'],
          summary: 'Reenviar verificación',
          description: 'Reenvía el correo de verificación al usuario',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Correo de verificación reenviado' },
            400: { description: 'La cuenta ya está verificada' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      // Auth - Recover Password
      '/auth/recover-password': {
        post: {
          tags: ['Auth'],
          summary: 'Recuperar contraseña',
          description: 'Envía un correo con enlace para restablecer la contraseña',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Correo de restablecimiento enviado' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      // Auth - Reset Password
      '/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Restablecer contraseña',
          description: 'Restablece la contraseña usando el token recibido por correo',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'email', 'password'],
                  properties: {
                    token: { type: 'string', description: 'Token de restablecimiento' },
                    email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
                    password: { type: 'string', minLength: 6, example: 'nuevaContraseña123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Contraseña restablecida exitosamente' },
            401: { description: 'Token inválido o expirado' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      // Auth - Change Password
      '/auth/change-password': {
        post: {
          tags: ['Auth'],
          summary: 'Cambiar contraseña',
          description: 'Cambia la contraseña del usuario autenticado',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
                    password: { type: 'string', minLength: 6, example: 'nuevaContraseña123' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Contraseña cambiada exitosamente' },
            401: { description: 'No autenticado' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      // Auth - Change Language
      '/auth/language': {
        put: {
          tags: ['Auth'],
          summary: 'Cambiar idioma',
          description: 'Cambia el idioma preferido del usuario',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'language'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'juan@ejemplo.com' },
                    language: { type: 'string', minLength: 3, maxLength: 3, example: 'esp', description: 'Código de idioma (3 caracteres)' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Idioma cambiado exitosamente' },
            401: { description: 'No autenticado' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      // Auth - Delete Account
      '/auth/account': {
        delete: {
          tags: ['Auth'],
          summary: 'Eliminar cuenta',
          description: 'Elimina la cuenta del usuario y todas sus transacciones asociadas',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Cuenta eliminada correctamente' },
            401: { description: 'No autenticado' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      // Transactions - Create
      '/transactions': {
        post: {
          tags: ['Transactions'],
          summary: 'Crear transacción',
          description: 'Crea una nueva transacción (ingreso o gasto)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransactionInput' },
              },
            },
          },
          responses: {
            201: {
              description: 'Transacción creada exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Transacción creada exitosamente' },
                      data: { $ref: '#/components/schemas/Transaction' },
                    },
                  },
                },
              },
            },
            400: { description: 'Datos de entrada inválidos' },
            401: { description: 'No autenticado' },
          },
        },
        get: {
          tags: ['Transactions'],
          summary: 'Listar transacciones',
          description: 'Obtiene las transacciones del usuario con paginación y filtros',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Número de página' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 }, description: 'Elementos por página' },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['income', 'expense'] }, description: 'Filtrar por tipo' },
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filtrar por categoría' },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Fecha inicial' },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Fecha final' },
          ],
          responses: {
            200: {
              description: 'Lista de transacciones',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          transactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              pages: { type: 'integer' },
                            },
                          },
                          summary: {
                            type: 'object',
                            properties: {
                              totalIncome: { type: 'number' },
                              totalExpense: { type: 'number' },
                              balance: { type: 'number' },
                              transactionCount: { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/transactions/{_id}': {
        get: {
          tags: ['Transactions'],
          summary: 'Obtener transacción',
          description: 'Obtiene una transacción por su ID',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: '_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la transacción' },
          ],
          responses: {
            200: {
              description: 'Transacción encontrada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Transaction' },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
            404: { description: 'Transacción no encontrada' },
          },
        },
        put: {
          tags: ['Transactions'],
          summary: 'Actualizar transacción',
          description: 'Actualiza una transacción existente',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: '_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la transacción' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['income', 'expense'] },
                    amount: { type: 'number', minimum: 0.01 },
                    category: { type: 'string', maxLength: 50 },
                    description: { type: 'string', maxLength: 200 },
                    date: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Transacción actualizada' },
            401: { description: 'No autenticado' },
            404: { description: 'Transacción no encontrada' },
          },
        },
        delete: {
          tags: ['Transactions'],
          summary: 'Eliminar transacción',
          description: 'Elimina (soft delete) una transacción',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: '_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la transacción' },
          ],
          responses: {
            200: { description: 'Transacción eliminada' },
            401: { description: 'No autenticado' },
            404: { description: 'Transacción no encontrada' },
          },
        },
      },
      '/transactions/stats/monthly': {
        get: {
          tags: ['Transactions'],
          summary: 'Estadísticas mensuales',
          description: 'Obtiene estadísticas de transacciones agrupadas por categoría para un mes específico',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'year', in: 'query', required: true, schema: { type: 'integer' }, description: 'Año', example: 2024 },
            { name: 'month', in: 'query', required: true, schema: { type: 'integer', minimum: 1, maximum: 12 }, description: 'Mes (1-12)', example: 11 },
          ],
          responses: {
            200: {
              description: 'Estadísticas mensuales',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          month: { type: 'integer' },
                          year: { type: 'integer' },
                          stats: { type: 'array', items: { type: 'object' } },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Año y mes son requeridos' },
            401: { description: 'No autenticado' },
          },
        },
      },
      // Categories
      '/categories': {
        post: {
          tags: ['Categories'],
          summary: 'Crear categoría',
          description: 'Crea una nueva categoría personalizada',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryInput' },
              },
            },
          },
          responses: {
            201: {
              description: 'Categoría creada exitosamente',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Categoría creada exitosamente' },
                      data: { $ref: '#/components/schemas/Category' },
                    },
                  },
                },
              },
            },
            400: { description: 'Datos de entrada inválidos' },
            401: { description: 'No autenticado' },
          },
        },
        get: {
          tags: ['Categories'],
          summary: 'Listar categorías',
          description: 'Obtiene todas las categorías (del sistema y del usuario)',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de categorías',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                    },
                  },
                },
              },
            },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/categories/{_id}': {
        put: {
          tags: ['Categories'],
          summary: 'Actualizar categoría',
          description: 'Actualiza una categoría del usuario (no se pueden modificar categorías del sistema)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: '_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la categoría' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CategoryInput' },
              },
            },
          },
          responses: {
            200: { description: 'Categoría actualizada' },
            400: { description: 'Datos de entrada inválidos' },
            401: { description: 'No autenticado' },
            403: { description: 'No se puede modificar una categoría del sistema' },
            404: { description: 'Categoría no encontrada' },
          },
        },
        delete: {
          tags: ['Categories'],
          summary: 'Eliminar categoría',
          description: 'Elimina (soft delete) una categoría del usuario (no se pueden eliminar categorías del sistema)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: '_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la categoría' },
          ],
          responses: {
            200: { description: 'Categoría eliminada' },
            401: { description: 'No autenticado' },
            403: { description: 'No se pueden eliminar categorías del sistema' },
            404: { description: 'Categoría no encontrada' },
          },
        },
      },
      // Notifications
      '/notifications/{userId}': {
        post: {
          tags: ['Notifications'],
          summary: 'Obtener notificaciones no leídas',
          description: 'Obtiene las notificaciones no leídas del usuario',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID del usuario' },
          ],
          responses: {
            200: {
              description: 'Notificación encontrada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Notification' },
                    },
                  },
                },
              },
            },
            204: { description: 'No hay notificaciones no leídas' },
            401: { description: 'No autenticado' },
          },
        },
        put: {
          tags: ['Notifications'],
          summary: 'Marcar todas como leídas',
          description: 'Marca todas las notificaciones del usuario como leídas',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID del usuario' },
          ],
          responses: {
            200: {
              description: 'Notificaciones marcadas como leídas',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          matchedCount: { type: 'integer', example: 5 },
                          modifiedCount: { type: 'integer', example: 5 },
                        },
                      },
                    },
                  },
                },
              },
            },
            204: { description: 'No hay notificaciones' },
            401: { description: 'No autenticado' },
          },
        },
      },
      '/notifications/{userId}/{_id}': {
        put: {
          tags: ['Notifications'],
          summary: 'Marcar notificación como leída',
          description: 'Marca una notificación específica como leída',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID del usuario' },
            { name: '_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la notificación' },
          ],
          responses: {
            200: {
              description: 'Notificación marcada como leída',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Notification' },
                    },
                  },
                },
              },
            },
            204: { description: 'Notificación no encontrada' },
            401: { description: 'No autenticado' },
          },
        },
        delete: {
          tags: ['Notifications'],
          summary: 'Eliminar notificación',
          description: 'Elimina (soft delete) una notificación',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'userId', in: 'path', required: true, schema: { type: 'string' }, description: 'ID del usuario' },
            { name: '_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID de la notificación' },
          ],
          responses: {
            200: {
              description: 'Notificación eliminada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Notification' },
                    },
                  },
                },
              },
            },
            204: { description: 'Notificación no encontrada' },
            401: { description: 'No autenticado' },
          },
        },
      },
      // Metrics
      '/metrics': {
        get: {
          tags: ['Metrics'],
          summary: 'Métricas del sistema',
          description: 'Obtiene métricas de rendimiento y estado del servidor (endpoint público para monitoreo)',
          security: [],
          responses: {
            200: {
              description: 'Métricas del sistema',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Metrics' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
