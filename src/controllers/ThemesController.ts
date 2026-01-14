import { Theme } from '../models/Theme';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Esquema de validación para crear/modificar un tema
const createThemeSchema = z.object({
    meta: z.object({
        name: z.string(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional()
    }),
    mode: z.string(),
    palette: z.object({
        primary: z.string(),
        secondary: z.string().optional(),
        success: z.string().optional(),
        warning: z.string().optional(),
        error: z.string().optional(),
        info: z.string().optional(),
        background: z.object({
            app: z.string(),
            container: z.string(),
            elevated: z.string()
        }),
        text: z.object({
            primary: z.string(),
            secondary: z.string(),
            disabled: z.string()
        }),
        border: z.object({
            color: z.string(),
            radius: z.number()
        })
    }),
    typography: z.object({
        fontFamily: z.string(),
        fontSizeBase: z.number(),
        lineHeight: z.number(),
        headingWeight: z.number(),
        bodyWeight: z.number()
    }),
    layout: z.object({
        headerHeight: z.number(),
        sidebarWidth: z.number(),
        contentPadding: z.number()
    }),
    components: z.object({
        button: z.object({
            borderRadius: z.number().optional()
        }).optional(),
        card: z.object({
            borderRadius: z.number().optional()
        }).optional()
    }).optional()
});

// Esquema de validación para actualizar un tema
const updateThemesSchema = z.object({
    _id: z.string().min(1, 'El ID es requerido')
});

/**
 * Crear un tema por usuario...
 * @param req 
 * @param res 
 * @param next 
 */
export const createUserTheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validatedData = createThemeSchema.parse(req.body);
        logger.info('validated Theme Data', validatedData);

        const theme = new Theme(validatedData);
        theme.userId = req.user!.id as any;

        await theme.save();
        res.status(201).json({
            success: true,
            message: 'Theme created successfully',
            data: `Theme ${theme.meta.name} in mode ${theme.mode} was created successfully`
        });
    } catch (error) {
        logger.error('Error creating user theme', error);
        next(error);
    }
};

/**
 * Obtener todos los temas por usuario...
 * @param req 
 * @param res 
 * @param next 
 */
export const getUserThemes = async ( req: Request, res: Response, next: NextFunction ) => {
    try {
        const themes = await Theme.find({ userId: req.user!.id }).select('_id name mode');
        res.json({
            success: true,
            data: themes
        });

    } catch (error) {
        logger.error('Error getting user themes', error);
        next(error);
    }
}

/**
 * Obtener tema por id
 */
export const getThemeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = updateThemesSchema.parse(req.params);
        const theme = await Theme.findOne({ _id: validatedData._id, userId: req.user!.id });
        theme && res.json({
            success: true,
            data: theme
        });
    } catch (error) {
        logger.error('Error getting theme by id', error);
        next(error);
    }
}

/**
 * actualizar tema de usuario...
 * @param req 
 * @param res 
 * @param next 
 */
export const updateUserTheme = async ( req: Request, res: Response, next: NextFunction ) => {
    try {
        const validatedData = updateThemesSchema.parse(req.params);
        const validatedBody = createThemeSchema.parse(req.body);
        logger.info('validated Theme Data', validatedData);
        const theme = await Theme.findOne({ _id: validatedData._id, userId: req.user!.id });
        theme && await theme.updateOne({
            $set: validatedBody
        });
        res.json({
            success: true,
            message: 'Theme updated successfully',
            data: `Theme ${theme?.meta.name} in mode ${theme?.mode} was updated successfully`
        });
    } catch (error) {
        logger.error('Error updating user theme', error);
        next(error);
    }
}