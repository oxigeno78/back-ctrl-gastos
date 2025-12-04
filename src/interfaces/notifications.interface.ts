import type { Document, Types } from 'mongoose';

export interface INotification extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: 'info' | 'success' | 'warning' | 'error';
    // Soporte para texto directo o claves de i18n
    title?: string;
    message?: string;
    titleKey?: string;
    messageKey?: string;
    messageParams?: Record<string, unknown>;
    link?: string;
    read: boolean;
    deleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Payload para mensajes de RabbitMQ
export interface INotificationPayload {
    userId: string;
    type: 'info' | 'success' | 'warning' | 'error';
    titleKey?: string;
    messageKey?: string;
    title?: string;
    message?: string;
    messageParams?: Record<string, string | number>;
    link?: string;
    createdAt: string;
}
