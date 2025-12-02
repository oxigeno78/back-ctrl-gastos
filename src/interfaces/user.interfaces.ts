import type { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  lastLoginAt?: Date | null;
  lastLogoutAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  language?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
