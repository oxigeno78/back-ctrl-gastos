import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { z } from 'zod';
import crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import sgMail from '@sendgrid/mail';
import { authInterfaces} from '../interfaces';
import { config } from '../config';
import { logger } from '../utils/logger';

// Opciones de cookie HTTP-only para el token de sesión
const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  maxAge: config.cookie.maxAge,
  path: '/',
  ...(config.cookie.domain && { domain: config.cookie.domain }),
});

// Esquemas de validación con Zod
const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'El nombre no puede exceder 50 caracteres'),
  email: z.string().email('Email inválido').transform(e => e.toLowerCase()),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  recaptchaToken: z.string().min(1, 'Token de reCAPTCHA requerido'),
  language: z.string().min(3, 'El idioma debe tener al menos 3 caracteres').max(3, 'El idioma debe tener máximo 3 caracteres').optional()
});

const loginSchema = z.object({
  email: z.string().email('Email inválido').transform(e => e.toLowerCase()),
  password: z.string().min(1, 'La contraseña es requerida'),
  recaptchaToken: z.string().min(1, 'Token de reCAPTCHA requerido')
});

// NOTA: verifySchema no se usa - la validación se hace inline en verifyEmail
// const verifySchema = z.object({
//   token: z.string(),
//   email: z.string().email('Email inválido')
// });

const emailSchema = z.object({
  email: z.string().email('Email inválido').transform(e => e.toLowerCase())
});

const resetPasswordSchema = z.object({
  token: z.string(),
  email: z.string().email('Email inválido').transform(e => e.toLowerCase()),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const changeLanguageSchema = z.object({
  language: z.string().min(3, 'El idioma debe tener al menos 3 caracteres').max(3, 'El idioma debe tener máximo 3 caracteres')
});

const changeCurrencySchema = z.object({
  currency: z.string().min(3, 'La moneda debe tener al menos 3 caracteres').max(3, 'La moneda debe tener máximo 3 caracteres')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres')
});

const recoveryPasswordSchema = z.object({
  email: z.string().email('Email inválido').transform(e => e.toLowerCase())
});

const verifyRecaptcha = async (token: string): Promise<boolean> => {
  if (!config.recaptchaSecretKey) {
    throw new Error('RECAPTCHA_SECRET_KEY no está configurado');
  }

  const params = new URLSearchParams();
  params.append('secret', config.recaptchaSecretKey);
  params.append('response', token);

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`Error verificando reCAPTCHA: ${response.status}`);
  }

  const data = await response.json() as { success: boolean; score?: number; action?: string; ['error-codes']?: string[] };

  return Boolean(data.success);
};

// Función para generar JWT
export const generateToken = (payload: authInterfaces.JWTPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  } as jwt.SignOptions);
};

// Helper para crear transporte de correo (SMTP o AWS SES)
const createMailTransport = async (): Promise<nodemailer.Transporter> => {
  const provider = config.email.provider.toLowerCase();

  if (provider === 'sendgrid') {
    if (!config.email.sendgrid.apiKey) {
      throw new Error('SENDGRID_API_KEY no está configurado para usar SendGrid');
    }

    sgMail.setApiKey(config.email.sendgrid.apiKey);

    const transporter = {
      // Adaptador simple para imitar nodemailer Transporter
      sendMail: async (options: nodemailer.SendMailOptions) => {
        const msg = {
          to: options.to as any,
          from: (options.from as any) || config.email.from,
          subject: options.subject,
          html: options.html,
          text: options.text,
        } as sgMail.MailDataRequired;

        await sgMail.send(msg);

        return {} as any;
      },
    } as any as nodemailer.Transporter;

    return transporter;
  }

  if (provider === 'ses') {
    if (!config.aws.region) {
      throw new Error('AWS_REGION no configurado para usar SES');
    }
    const ses = new SESv2Client({ region: config.aws.region });
    // Nodemailer con AWS SDK v3 (SESv2) usando SendEmailCommand
    const transporter = nodemailer.createTransport({
      SES: { ses, aws: { SendEmailCommand } } as any
    } as any);
    return transporter;
  }

  // Default: SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
  const { host, port, user, pass } = config.email.smtp;

  if (!host || !port || !user || !pass) {
    throw new Error('SMTP no está configurado. Defina SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
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

    if (config.frontendUrl) {
      const url = config.frontendUrl.replace(/\/$/, '') + '/auth/login?verified=1';
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
    const { email } = emailSchema.parse(req.body);

    const user = await User.findOne({ email })
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

    const verifyLink = `${config.apiUrlBase}${config.apiBasePath}/auth/verify?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    logger.debug('Reenviando link de verificación:', verifyLink);

    try {
      const transporter = await createMailTransport();
      await transporter.sendMail({
        from: config.email.from,
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
    const { name, email, password, recaptchaToken, language='esp' } = validatedData;

    const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaValid) {
      res.status(400).json({
        success: false,
        message: 'Falló la validación de reCAPTCHA'
      });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationExpires');
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'El usuario ya existe con este email'
      });
      return;
    }

    // Calcular fecha de fin del período de prueba (7 días)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // Crear nuevo usuario con período de prueba
    const user = new User({ 
      name, 
      email, 
      password, 
      isVerified: false, 
      language,
      subscriptionStatus: 'trialing',
      subscriptionCurrentPeriodEnd: trialEndDate
    });

    // Generar token de verificación
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h

    await user.save();

    // Construir link de verificación
    const verifyLink = `${config.apiUrlBase}${config.apiBasePath}/auth/verify?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    // Enviar email de verificación
    try {
      const transporter = await createMailTransport();
      await transporter.sendMail({
        from: config.email.from,
        to: user.email,
        subject: 'Confirma tu correo',
        html: `<p>Hola ${user.name}, confirma tu correo haciendo clic aquí: <a href="${verifyLink}">Confirmar</a></p>`
      });
    } catch (mailErr) {
      logger.error('Error enviando email de verificación:', mailErr);
      if(config.email.debug){
        logger.debug('Enviando email de verificación:', verifyLink);
        logger.debug('Enviando email de verificación:', user.email);
        logger.debug('Enviando email de verificación:', config.email.from);
        logger.debug('Enviando email de verificación:', config.email.provider);
        logger.debug('Enviando email de verificación:', config.email.smtp.host);
        logger.debug('Enviando email de verificación:', config.email.smtp.port);
        logger.debug('Enviando email de verificación:', config.email.smtp.user);
        logger.debug('Enviando email de verificación:', config.aws.region);
      }

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
    const { email, password, recaptchaToken } = validatedData;

    const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaValid) {
      logger.warn('Falló la validación de reCAPTCHA');
      res.status(400).json({
        success: false,
        message: 'Falló la validación de reCAPTCHA'
      });
      return;
    }

    // Buscar usuario por email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.debug('Login fallido: usuario no encontrado');
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.debug('Login fallido: credenciales inválidas');
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    // Bloquear si no está verificado
    if (!user.isVerified) {
      logger.debug('Login fallido: cuenta no verificada');
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

    // Establecer cookie HTTP-only con el token
    res.cookie(config.cookie.name, token, getCookieOptions());

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email
        },
        language: user.language
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
    // Obtener email del body o del usuario autenticado
    const email = req.body?.email || req.user?.email;
    
    if (email) {
      const user = await User.findOne({ email }).select('+lastLogoutAt');
      if (user) {
        user.lastLogoutAt = new Date();
        await user.save();
      }
    }

    // Limpiar la cookie HTTP-only
    res.clearCookie(config.cookie.name, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      path: '/',
      ...(config.cookie.domain && { domain: config.cookie.domain }),
    });

    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar token (soporta HTTP-only cookie y header Authorization)
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Intentar obtener token de la cookie HTTP-only primero, luego del header
    const cookieToken = req.cookies?.[config.cookie.name];
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    const token = cookieToken || headerToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as authInterfaces.JWTPayload;
    
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

// Obtener información del usuario autenticado (útil para verificar sesión con HTTP-only cookies)
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const user = await User.findById(req.user.id).select('name email language subscriptionStatus subscriptionCurrentPeriodEnd');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          language: user.language,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const recoveryUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = recoveryPasswordSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) {
      logger.debug('Recuperación de contraseña: usuario no encontrado');
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
    const resetLink = `${config.frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
    try {
      const transporter = await createMailTransport();
      await transporter.sendMail({
        from: config.email.from,
        to: user.email,
        subject: 'Restablece tu contraseña',
        html: `<p>Hola ${user.name}, restablece tu contraseña haciendo clic aquí: <a href="${resetLink}">Restablecer</a></p>`
      });
    } catch (mailErr) {
      logger.error('Error enviando email de restablecimiento de contraseña:', mailErr);
    }
    res.json({
      success: true,
      message: 'Correo de restablecimiento de contraseña enviado'
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

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, email, password } = resetPasswordSchema.parse(req.body);
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (!user.passwordResetExpires) {
      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
      return;
    }
    if (user.passwordResetToken !== tokenHash || user.passwordResetExpires < new Date()) {
      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
      return;
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    logger.error('Error en resetPassword:', error);
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validar datos de entrada
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    
    // Usar el usuario autenticado (no permitir cambiar contraseña de otro usuario)
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
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

export const changeLanguage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { language } = changeLanguageSchema.parse(req.body);
    
    // Usar el usuario autenticado
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    user.language = language;
    await user.save();

    res.json({
      success: true,
      message: 'Idioma cambiado exitosamente'
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

export const updateCurrency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currency } = changeCurrencySchema.parse(req.body);
    
    // Usar el usuario autenticado
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    user.currency = currency;
    await user.save();

    res.json({
      success: true,
      message: 'Moneda cambiada exitosamente'
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

// Eliminar cuenta de usuario y sus transacciones asociadas
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
      return;
    }

    // Eliminar todas las transacciones asociadas al usuario
    await Transaction.deleteMany({ userId }).catch((error) => {
      logger.error('Error eliminando transacciones del usuario:', userId, error);
    });

    // Eliminar el usuario
    const deletedUser = await User.findByIdAndDelete(userId as any);

    if (!deletedUser) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Limpiar la cookie de sesión
    res.clearCookie(config.cookie.name, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      path: '/',
      ...(config.cookie.domain && { domain: config.cookie.domain }),
    });

    res.json({
      success: true,
      message: 'Cuenta y transacciones eliminadas correctamente'
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