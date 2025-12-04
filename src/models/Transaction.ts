import mongoose, { Schema } from 'mongoose';
import { transactionsInterfaces } from '../interfaces';
import { periodicity } from '../interfaces/transaction.interfaces';

const transactionSchema = new Schema<transactionsInterfaces.ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido']
  },
  type: {
    type: String,
    required: [true, 'El tipo de transacción es requerido'],
    enum: {
      values: ['income', 'expense'],
      message: 'El tipo debe ser "income" o "expense"'
    }
  },
  periodicity: {
    type: Number,
    enum: {
      values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      message: 'La periodicidad debe ser un número entre 0 y 10'
    },
    default: 0
  },
  every: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: [true, 'El monto es requerido'],
    min: [0.01, 'El monto debe ser mayor a 0']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    trim: true,
    maxlength: [50, 'La categoría no puede exceder 50 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [200, 'La descripción no puede exceder 200 caracteres']
  },
  date: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    default: Date.now
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento de las consultas
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

transactionSchema.methods.getPeriodicityText = async (periodicityNumber: number): Promise<string> => {
  const periodicityNames: {[key: number]: string} = periodicity;
  return periodicityNames[periodicityNumber];
};

export const Transaction = mongoose.model<transactionsInterfaces.ITransaction>('Transaction', transactionSchema);
