import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction';
import { z } from 'zod';
import { Types } from 'mongoose';

// Esquemas de validación
export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'El tipo debe ser "income" o "expense"' })
  }),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  category: z.string().min(1, 'La categoría es requerida').max(50, 'La categoría no puede exceder 50 caracteres'),
  description: z.string().min(1, 'La descripción es requerida').max(200, 'La descripción no puede exceder 200 caracteres'),
  date: z.string().datetime().optional()
});

export const getTransactionsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Crear nueva transacción
export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createTransactionSchema.parse(req.body);
    const { type, amount, category, description, date } = validatedData;

    const transaction = new Transaction({
      userId: req.user!.id as any,
      type,
      amount,
      category,
      description,
      date: date ? new Date(date) : new Date()
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transacción creada exitosamente',
      data: transaction
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

// Obtener transacciones del usuario
export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedQuery = getTransactionsSchema.parse(req.query);
    const { page, limit, type, category, startDate, endDate } = validatedQuery;

    // Construir filtros
    const filters: any = { userId: req.user!.id as any };
    
    if (type) filters.type = type;
    if (category) filters.category = new RegExp(category, 'i');
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) filters.date.$gte = new Date(startDate);
      if (endDate) filters.date.$lte = new Date(endDate);
    }

    // Calcular paginación
    const skip = (page - 1) * limit;

    // Ejecutar consulta
    const [transactions, total] = await Promise.all([
      Transaction.find(filters)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filters)
    ]);

    // Calcular estadísticas
    const stats = await Transaction.aggregate([
      { $match: { userId: new Types.ObjectId(req.user!.id) } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const incomeStats = stats.find(stat => stat._id === 'income') || { total: 0, count: 0 };
    const expenseStats = stats.find(stat => stat._id === 'expense') || { total: 0, count: 0 };

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalIncome: incomeStats.total,
          totalExpense: expenseStats.total,
          balance: incomeStats.total - expenseStats.total,
          transactionCount: incomeStats.count + expenseStats.count
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors: error.errors
      });
      return;
    }
    next(error);
  }
};

// Obtener estadísticas mensuales
export const getMonthlyStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      res.status(400).json({
        success: false,
        message: 'Año y mes son requeridos'
      });
      return;
    }

    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0, 23, 59, 59);

    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(req.user!.id),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          categories: {
            $push: {
              category: '$_id.category',
              total: '$total',
              count: '$count'
            }
          },
          total: { $sum: '$total' },
          count: { $sum: '$count' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        month: parseInt(month as string),
        year: parseInt(year as string),
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};