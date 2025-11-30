import { Request, Response, NextFunction } from 'express';
import { errorInterfaces } from '../interfaces';

// Middleware centralizado de manejo de errores
export const errorHandler = (
  err: errorInterfaces.CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);
  console.error(err.stack);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = {
      message,
      statusCode: 400,
      isOperational: true
    } as errorInterfaces.CustomError;
  }

  // Error de duplicado de Mongoose
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    const message = `${field} ya existe`;
    error = {
      message,
      statusCode: 400,
      isOperational: true
    } as errorInterfaces.CustomError;
  }

  // Error de cast de Mongoose
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = {
      message,
      statusCode: 404,
      isOperational: true
    } as errorInterfaces.CustomError;
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = {
      message,
      statusCode: 401,
      isOperational: true
    } as errorInterfaces.CustomError;
  }

  // Error de expiración de JWT
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = {
      message,
      statusCode: 401,
      isOperational: true
    } as errorInterfaces.CustomError;
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    const message = 'JSON inválido';
    error = {
      message,
      statusCode: 400,
      isOperational: true
    } as errorInterfaces.CustomError;
  }

  // Respuesta de error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Middleware para manejar rutas no encontradas
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`) as errorInterfaces.CustomError;
  error.statusCode = 404;
  next(error);
};

// Middleware para manejar errores asíncronos
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
