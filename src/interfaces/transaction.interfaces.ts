import type { Document, Types } from 'mongoose';

/**
 * type: income (ingresos) | expense (gastos)
 * periodicity: 
 * 0 one-time / disable (una sola vez o desactivado)
 * 1 daily (diario)
 * 2 weekly (semanal)
 * 3 fortnightly (catorcenal)
 * 4 bi-weekly (quincenal)
 * 5 monthly (mensual)
 * 6 bi-monthly (bimestral)
 * 7 quarterly (trimestral)
 * 8 semi-annual (semestral)
 * 9 yearly (anual)
 * 10 custom (personalizado)
 */
export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: 'income' | 'expense';
  periodicity: PeriodicityValues;
  every: string|null;
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  deleted: boolean;
  getPeriodicityText(periodicityNumber: number): Promise<string>;
  periodicityText?: string;
}


export enum PeriodicityValues {
  ONE_TIME = 0,
  DAILY = 1,
  WEEKLY = 2,
  FORTNIGHTLY = 3,
  BI_WEEKLY = 4,
  MONTHLY = 5,
  BI_MONTHLY = 6,
  QUARTERLY = 7,
  SEMI_ANNUAL = 8,
  YEARLY = 9,
  CUSTOM = 10
}

export enum PeriodicityText {
  ONE_TIME = 'one-time',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  FORTNIGHTLY = 'fortnightly',
  BI_WEEKLY = 'bi-weekly',
  MONTHLY = 'monthly',
  BI_MONTHLY = 'bi-monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi-annual',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

export const periodicity = {
  0: 'one-time',
  1: 'daily',
  2: 'weekly',
  3: 'fortnightly',
  4: 'bi-weekly',
  5: 'monthly',
  6: 'bi-monthly',
  7: 'quarterly',
  8: 'semi-annual',
  9: 'yearly',
  10: 'custom'
};

export const periodicityOptions = Object.values(PeriodicityText);
