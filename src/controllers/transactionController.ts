import { Request, Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Categorys';
import { z } from 'zod';
import { Types } from 'mongoose';

// Helper para verificar si un string es un ObjectId válido
const isValidObjectId = (str: string): boolean => Types.ObjectId.isValid(str) && new Types.ObjectId(str).toString() === str;

// Helper para resolver el nombre de categoría (ObjectId -> nombre, o devolver string original)
const resolveCategoryName = async (category: string): Promise<string> => {
  if (!isValidObjectId(category)) {
    const cat = await Category.findOne({ name: category }).lean();
    if (!cat) return category;
    return cat.name;
  } else {
    const cat = await Category.findById(category).lean();
    if (!cat) return category;
    return cat.name;
  }
};

// Helper para resolver nombre y color de categoría
const resolveCategoryDetails = async (category: string): Promise<{ name: string; color: string } | null> => {
  if (!isValidObjectId(category)) {
    const cat = await Category.findOne({ name: category }).lean();
    if (!cat) return null;
    return { name: cat.name, color: cat.color };
  } else {
    const cat = await Category.findById(category).lean();
    if (!cat) return null;
    return { name: cat.name, color: cat.color };
  }
};

// Esquemas de validación
const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'El tipo debe ser "income" o "expense"' })
  }),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  category: z.string().min(1, 'La categoría es requerida').max(50, 'La categoría no puede exceder 50 caracteres'),
  description: z.string().min(1, 'La descripción es requerida').max(200, 'La descripción no puede exceder 200 caracteres'),
  date: z.string().datetime().optional()
});

const getTransactionsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const getTransactionByIdSchema = z.object({
  _id: z.string().min(1, 'El ID es requerido')
});

const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive('El monto debe ser mayor a 0').optional(),
  category: z.string().min(1, 'La categoría es requerida').max(50, 'La categoría no puede exceder 50 caracteres').optional(),
  description: z.string().min(1, 'La descripción es requerida').max(200, 'La descripción no puede exceder 200 caracteres').optional(),
  date: z.string().datetime().optional()
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

// Obtener transacción por ID
export const getTransactionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params._id, deleted: false }).lean();
    if (!transaction || transaction.deleted) {
      res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
      return;
    }

    // Resolver nombre de categoría si es ObjectId
    const categoryName = await resolveCategoryName(transaction.category);

    res.json({
      success: true,
      data: { ...transaction, category: categoryName }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar transacción por ID
export const updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params._id, deleted: false },
      req.body,
      { new: true }
    );
    if (!transaction || transaction.deleted) {
      res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
      return;
    }
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar transacción por ID
export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { _id } = getTransactionByIdSchema.parse(req.params);
    const transaction = await Transaction.findOneAndUpdate(
      { _id, deleted: false },
      { deleted: true },
      { new: true }
    );
    if (!transaction) {
      res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
      return;
    }
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// Obtener transacciones del usuario
export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedQuery = getTransactionsSchema.parse(req.query);
    const { page, limit, type, category, startDate, endDate } = validatedQuery;

    // Construir filtros
    const filters: any = { userId: req.user!.id as any, deleted: false };
    
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
    const [rawTransactions, total] = await Promise.all([
      Transaction.find(filters)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filters)
    ]);

    // Resolver nombres de categorías
    const transactions = await Promise.all(
      rawTransactions.map(async (t) => ({
        ...t,
        category: await resolveCategoryName(t.category)
      }))
    );

    // Calcular estadísticas
    const stats = await Transaction.aggregate([
      { $match: { userId: new Types.ObjectId(req.user!.id), deleted: false } },
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
          date: { $gte: startDate, $lte: endDate },
          deleted: false
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

    // Resolver nombres y colores de categorías en stats
    const resolvedStats = await Promise.all(
      stats.map(async (stat) => ({
        ...stat,
        categories: await Promise.all(
          stat.categories.map(async (cat: { category: string; total: number; count: number }) => {
            const details = await resolveCategoryDetails(cat.category);
            if (!details) return cat;
            return {
              ...cat,
              category: details.name,
              color: details.color
            };
          })
        )
      }))
    );

    res.json({
      success: true,
      data: {
        month: parseInt(month as string),
        year: parseInt(year as string),
        stats: resolvedStats
      }
    });
  } catch (error) {
    next(error);
  }
};