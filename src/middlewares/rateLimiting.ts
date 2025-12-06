import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Rate limiting para autenticación
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: {
    success: false,
    message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting general para API
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de logging (reemplaza a Morgan)
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const contentLength = res.get('Content-Length') || '-';
    const ip = req.ip || req.socket.remoteAddress || '-';
    const userAgent = req.get('User-Agent') || '-';
    const referrer = req.get('Referrer') || req.get('Referer') || '-';
    const httpVersion = `HTTP/${req.httpVersion}`;
    
    // Formato similar a Morgan 'combined':
    // :remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
    const logLine = `${ip} - "${req.method} ${req.originalUrl} ${httpVersion}" ${res.statusCode} ${contentLength} "${referrer}" "${userAgent}" (${duration}ms)`;
    
    // Usar nivel según status code
    if (res.statusCode >= 500) {
      logger.error(logLine);
    } else if (res.statusCode >= 400) {
      logger.warn(logLine);
    } else {
      logger.debug(logLine);
    }
  });
  
  next();
};

// Middleware para manejar errores de CORS
export const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado por CORS'
    });
    return;
  }
  next(err);
};
