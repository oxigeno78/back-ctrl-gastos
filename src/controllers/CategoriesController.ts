
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Categorys';

export const createCategorySchema = z.object({
    name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede exceder 50 caracteres'),
    type: z.enum(['income', 'expense'], {
        errorMap: () => ({ message: 'El tipo debe ser "income" o "expense"' })
    }),
    description: z.string().min(1, 'La descripción es requerida').max(200, 'La descripción no puede exceder 200 caracteres'),
    color: z.string().min(1, 'El color es requerido').max(7, 'El color debe tener al menos 7 caracteres')
});

export const getCategoriesSchema = z.object({
    _id: z.string().min(1, 'El ID es requerido')
});

export const updateCategorySchema = z.object({
    _id: z.string().min(1, 'El ID es requerido'),
    name: z.string().min(1, 'El nombre es requerido').max(50, 'El nombre no puede exceder 50 caracteres'),
    type: z.enum(['income', 'expense'], {
        errorMap: () => ({ message: 'El tipo debe ser "income" o "expense"' })
    }),
    description: z.string().min(1, 'La descripción es requerida').max(200, 'La descripción no puede exceder 200 caracteres'),
    color: z.string().min(1, 'El color es requerido').max(7, 'El color debe tener al menos 7 caracteres')
});

export const deleteCategorySchema = z.object({
    _id: z.string().min(1, 'El ID es requerido')
});

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = createCategorySchema.parse(req.body);
        const { name, type, description, color } = validatedData;

        const category = new Category({
            name,
            type,
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
        const { _id } = updateCategorySchema.parse(req.params);
        const validatedData = updateCategorySchema.parse(req.body);
        const { name, type, description, color } = validatedData;

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

        const updatedCategory = await Category.findOneAndUpdate(
            { _id, deleted: false, type: 'user' },
            { name, type, description, color },
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
        const { _id } = deleteCategorySchema.parse(req.params);
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

        const category = await Category.findOneAndUpdate(
            { _id, deleted: false },
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