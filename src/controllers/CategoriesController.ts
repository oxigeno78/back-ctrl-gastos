
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Categorys';

const createCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede exceder 50 caracteres'),
    transactionType: z.enum(['income', 'expense'], {
        errorMap: () => ({ message: 'El tipo debe ser "income" o "expense"' })
    }),
    description: z.string().min(1, 'La descripción es requerida').max(200, 'La descripción no puede exceder 200 caracteres'),
    color: z.string().min(1, 'El color es requerido').max(7, 'El color debe tener al menos 7 caracteres')
});

// NOTA: getCategoriesSchema no se usa - getCategories no requiere parámetros
// const getCategoriesSchema = z.object({
//     _id: z.string().min(1, 'El ID es requerido')
// });

const updateCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede exceder 50 caracteres'),
    transactionType: z.enum(['income', 'expense'], {
        errorMap: () => ({ message: 'El tipo de transacción debe ser "income" o "expense"' })
    }),
    description: z.string().min(1, 'La descripción es requerida').max(200, 'La descripción no puede exceder 200 caracteres'),
    color: z.string().min(1, 'El color es requerido').max(7, 'El color debe tener al menos 7 caracteres')
});

const categoryIdInParam =z.object({
    _id: z.string().min(1, 'El ID es requerido')
})

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = createCategorySchema.parse(req.body);
        const { name, transactionType, description, color } = validatedData;

        const category = new Category({
            name,
            type: 'user',
            transactionType,
            description,
            color,
            userId: req.user!.id as any
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            data: category
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

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const defaultCategories = await Category.find({ deleted: false, type: 'system' });
        const categories = await Category.find({ userId: req.user!.id, deleted: false });
        res.json({
            success: true,
            data: categories.concat(defaultCategories)
        });
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { _id } = categoryIdInParam.parse(req.params);
        const validatedData = updateCategorySchema.parse(req.body);
        const { name, transactionType, description, color } = validatedData;

        // Verificar que la categoría pertenezca al usuario o sea del sistema
        const category = await Category.findOne({ _id, deleted: false });
        
        if (!category || category.deleted) {
            res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
            return;
        }
        if(category.type === 'system') {
            res.status(403).json({
                success: false,
                message: 'No se puede modificar una categoría del sistema'
            });
            return;
        }

        // Verificar que la categoría pertenezca al usuario autenticado
        if (category.userId?.toString() !== req.user!.id) {
            res.status(403).json({
                success: false,
                message: 'No tienes permiso para modificar esta categoría'
            });
            return;
        }

        const updatedCategory = await Category.findOneAndUpdate(
            { _id, userId: req.user!.id, deleted: false, type: 'user' },
            { name, transactionType, description, color },
            { new: true }
        );

        res.json({
            success: true,
            data: updatedCategory
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

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { _id } = categoryIdInParam.parse(req.params);
        const existingCategory = await Category.findOne({ _id, deleted: false });

        if (!existingCategory) {
            res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
            return;
        }

        if (existingCategory.type === 'system') {
            res.status(403).json({
                success: false,
                message: 'No se pueden eliminar categorías del sistema'
            });
            return;
        }

        // Verificar que la categoría pertenezca al usuario autenticado
        if (existingCategory.userId?.toString() !== req.user!.id) {
            res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta categoría'
            });
            return;
        }

        const category = await Category.findOneAndUpdate(
            { _id, userId: req.user!.id, deleted: false, type: 'user' },
            { deleted: true },
            { new: true }
        );

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};