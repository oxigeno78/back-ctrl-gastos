import type { Document, Types } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    type: 'system' | 'user';
    userId?: Types.ObjectId|string;
    description: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    deleted: boolean;
    deletedAt: Date|null;
}