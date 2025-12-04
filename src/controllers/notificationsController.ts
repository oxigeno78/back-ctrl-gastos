import { Types } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { z } from 'zod';

const getUnReadNotificationByUserIdSchema = z.object({
    userId: z.string().min(1, 'El ID es requerido')
});

const getNotificationByIdSchema = z.object({
    userId: z.string().min(1, 'El ID es requerido'),
    _id: z.string().min(1, 'El ID es requerido')
});

const getAllNotificationByUserIdSchema = z.object({
    userId: z.string().min(1, 'El ID es requerido')
});

export const getUnReadNotificationByUserId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = getUnReadNotificationByUserIdSchema.parse(req.params);
        const notification = await Notification.findOne({ userId, deleted: false, read: false }).lean();
        if (!notification || notification.deleted || notification.read) {
            res.status(204).json({
                success: false,
                message: 'No hay notificaciones no leidas'
            });
            return;
        }
        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

export const setNotificationAsReaded = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { _id, userId } = getNotificationByIdSchema.parse(req.params);
        console.log('[' + new Date().toISOString() + '] ' + 'setNotificationAsReaded: ' + _id);
        const notification = await Notification.findOneAndUpdate(
            { _id, deleted: false },
            { read: true },
            { new: true }
        );
        if (!notification) {
            res.status(204).json({
                success: false,
                message: 'No hay notificaciones no leidas'
            });
            return;
        }
        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

export const setAllNotificationsAsReaded = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { userId } = getAllNotificationByUserIdSchema.parse(req.params);
        const notifications = await Notification.updateMany(
            { userId, deleted: false },
            { read: true }
        );
        if (!notifications) {
            res.status(204).json({
                success: false,
                message: 'No hay notificaciones no leidas'
            });
            return;
        }
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { _id, userId } = getNotificationByIdSchema.parse(req.params);
        const notification = await Notification.findOneAndUpdate(
            { _id, deleted: false },
            { deleted: true },
            { new: true }
        );
        if (!notification) {
            res.status(204).json({
                success: false,
                message: 'No hay notificaciones no leidas'
            });
            return;
        }
        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
};