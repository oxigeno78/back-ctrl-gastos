import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
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
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento de las consultas
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
