import type { Document } from 'mongoose';

export type SubscriptionStatus = 'incomplete' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'paused';

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
  currency?: string;
  // Stripe subscription fields
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: SubscriptionStatus | null;
  subscriptionCurrentPeriodEnd?: Date | null;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
