import mongoose, { Schema, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { userInterfaces } from '../interfaces';

const userSchema = new Schema<userInterfaces.IUser>({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [12, 'La contraseña debe tener al menos 12 caracteres']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    default: null,
    select: false
  },
  passwordResetToken:{
    type: String,
    default: null,
    select: false
  },
  passwordResetExpires:{
    type: Date,
    default: null,
    select: false
  },
  lastLoginAt: {
    type: Date,
    default: null,
    select: false
  },
  lastLogoutAt: {
    type: Date,
    default: null,
    select: false
  },
  language: {
    type: String,
    default: 'esp'
  },
  currency: {
    type: String,
    default: 'MXN'
  },
  theme: {
    type: Types.ObjectId,
    ref: 'Theme',
    default: null
  },
  // Stripe subscription fields
  stripeCustomerId: {
    type: String,
    default: null,
    sparse: true
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  subscriptionStatus: {
    type: String,
    enum: ['incomplete', 'active', 'past_due', 'canceled', 'unpaid', 'trialing', 'paused'],
    default: null
  },
  subscriptionCurrentPeriodEnd: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_, ret) {
      const { password, ...userWithoutPassword } = ret;
      return userWithoutPassword;
    }
  }
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<userInterfaces.IUser>('User', userSchema);
