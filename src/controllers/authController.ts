import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { z } from 'zod';
import crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

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

export const verifySchema = z.object({
  token: z.string(),
  email: z.string().email('Email inválido')
});

export const resendSchema = z.object({
  email: z.string().email('Email inválido')
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

// Helper para crear transporte de correo (SMTP o AWS SES)
const createMailTransport = async (): Promise<nodemailer.Transporter> => {
  const provider = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();

  if (provider === 'ses') {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    if (!region) {
      throw new Error('AWS_REGION no configurado para usar SES');
    }
    const ses = new SESv2Client({ region });
    // Nodemailer con AWS SDK v3 (SESv2) usando SendEmailCommand
    const transporter = nodemailer.createTransport({
      SES: { ses, aws: { SendEmailCommand } } as any
    } as any);
    return transporter;
  }

  // Default: SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
  const smtpHost = process.env.SMTP_HOST && process.env.SMTP_HOST != '' ? process.env.SMTP_HOST : 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT && !isNaN(parseInt(process.env.SMTP_PORT)) ? parseInt(process.env.SMTP_PORT) : undefined;
  const smtpUser = process.env.SMTP_USER && process.env.SMTP_USER != '' ? process.env.SMTP_USER : 'oxigeno78@gmail.com';
  const smtpPass = process.env.SMTP_PASS && process.env.SMTP_PASS != '' ? process.env.SMTP_PASS : 'fhgnqeanjxgjnehd';

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    console.error(smtpHost, `${smtpPort}, (${process.env.SMTP_PORT})` , smtpUser, smtpPass);
    throw new Error('SMTP no está configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
    debug: process.env.MAILER_DEBUG === 'true'
  } as SMTPTransport.Options);
}

// Verificar correo
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, email } = req.query as { token?: string; email?: string };
    if (!token || !email) {
      res.status(400).json({ success: false, message: 'Token o email faltante' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ email: String(email).toLowerCase() })
      .select('+emailVerificationToken +emailVerificationExpires');

    if (!user || !user.emailVerificationToken || user.emailVerificationToken !== tokenHash) {
      res.status(400).json({ success: false, message: 'Token inválido' });
      return;
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      res.status(400).json({ success: false, message: 'Token expirado' });
      return;
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    const frontendBase = process.env.FRONTEND_URL;
    if (frontendBase) {
      const url = frontendBase.replace(/\/$/, '') + '/auth/login?verified=1';
      res.redirect(302, url);
      return;
    }

    res.json({ success: true, message: 'Correo verificado exitosamente' });
  } catch (error) {
    next(error);
  }
};

// Reenviar verificación
export const resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bodySchema = z.object({ email: z.string().email('Email inválido') });
    const { email } = bodySchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'La cuenta ya está verificada' });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h
    await user.save();

    const appUrl = process.env.API_URL_BASE|| `http://localhost:${process.env.PORT || 5000}`;
    const apiBase = process.env.API_BASE_PATH || '/api/v1.0.0';
    const verifyLink = `${appUrl}${apiBase}/auth/verify?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    const smtpFrom = process.env.MAILER_FROM || 'no-reply@example.com';

    console.log('reenviando Link de verificación:', verifyLink);

    try {
      const transporter = await createMailTransport();
      await transporter.sendMail({
        from: smtpFrom,
        to: user.email,
        subject: 'Confirma tu correo (reenvío)',
        html: `<p>Hola ${user.name}, confirma tu correo: <a href="${verifyLink}">Confirmar</a></p>`
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'No se pudo enviar el correo de verificación', error: (err as Error).message });
      return;
    }

    res.json({ success: true, message: 'Correo de verificación reenviado' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Datos inválidos', errors: error.errors });
      return;
    }
    next(error);
  }
};

// Controlador de registro
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validar datos de entrada
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'El usuario ya existe con este email'
      });
      return;
    }

    // Crear nuevo usuario
    const user = new User({ name, email, password, isVerified: false });

    // Generar token de verificación
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h

    await user.save();

    // Construir link de verificación
    const appUrl = process.env.API_URL_BASE|| `http://localhost:${process.env.PORT || 5000}`;
    const apiBase = process.env.API_BASE_PATH || '/api/v1.0.0';
    const verifyLink = `${appUrl}${apiBase}/auth/verify?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    console.log('appUrl', appUrl);
    console.log('apiBase', apiBase);
    console.log('verifyLink', verifyLink);

    // Enviar email de verificación
    try {
      const smtpFrom = process.env.MAILER_FROM || 'no-reply@example.com';
      const transporter = await createMailTransport();
      await transporter.sendMail({
        from: smtpFrom,
        to: user.email,
        subject: 'Confirma tu correo',
        html: `<p>Hola ${user.name}, confirma tu correo haciendo clic aquí: <a href="${verifyLink}">Confirmar</a></p>`
      });
    } catch (mailErr) {
      console.error('Error enviando email de verificación:', mailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Registro exitoso. Revisa tu correo para confirmar tu cuenta.',
      data: {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        }
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

    // Bloquear si no está verificado
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Tu cuenta no está verificada. Revisa tu correo o solicita reenvío de verificación.'
      });
      return;
    }

    // Generar token
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email
    });

    user.lastLoginAt = new Date();
    await user.save();

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

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logoutUser = resendSchema.parse(req.body);
    const { email } = logoutUser;
    const user = await User.findOne({ email }).select('+lastLogoutAt');
    if (user) {
      user.lastLogoutAt = new Date();
      await user.save();
    }
    console.log('user', user);

    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
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

export const recoveryUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h
    await user.save();
    const appUrl = process.env.API_URL_BASE|| `http://localhost:${process.env.PORT || 5000}`;
    const apiBase = process.env.API_BASE_PATH || '/api/v1.0.0';
    const resetLink = `${appUrl}${apiBase}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    const smtpFrom = process.env.MAILER_FROM || 'no-reply@example.com';
    try {
      const transporter = await createMailTransport();
      await transporter.sendMail({
        from: smtpFrom,
        to: user.email,
        subject: 'Restablece tu contraseña',
        html: `<p>Hola ${user.name}, restablece tu contraseña haciendo clic aquí: <a href="${resetLink}">Restablecer</a></p>`
      });
    } catch (mailErr) {
      console.error('Error enviando email de restablecimiento de contraseña:', mailErr);
    }
    res.json({
      success: true,
      message: 'Correo de restablecimiento de contraseña enviado'
    });
  } catch (error) {
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