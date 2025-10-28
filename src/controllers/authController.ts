import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { z } from 'zod';

// Esquemas de validación con Zod
export const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

// Interfaz para el payload del JWT
export interface JWTPayload {
  userId: string;
  email: string;
}

// Función para generar JWT
export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET no está configurado');
  }
  
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
};

// Controlador de registro
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validar datos de entrada
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'El usuario ya existe con este email'
      });
      return;
    }

    // Crear nuevo usuario
    const user = new User({ name, email, password });
    await user.save();

    // Generar token
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors
      });
      return;
    }
    next(error);
  }
};

// Controlador de login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validar datos de entrada
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Buscar usuario por email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    // Generar token
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors
      });
      return;
    }
    next(error);
  }
};

// Middleware para verificar token
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({
        success: false,
        message: 'Error de configuración del servidor'
      });
      return;
    }
    
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Verificar que el usuario aún existe
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Token inválido - usuario no encontrado'
      });
      return;
    }

    // Agregar información del usuario al request
    req.user = {
      id: (user._id as any).toString(),
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
      return;
    }
    next(error);
  }
};

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}