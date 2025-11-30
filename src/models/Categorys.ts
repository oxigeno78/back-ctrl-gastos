import mongoose, { Schema } from 'mongoose';
import { categoriesInterfaces } from '../interfaces';


const categorySchema = new Schema<categoriesInterfaces.ICategory>({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [50, 'La categoría no puede exceder 50 caracteres']
    },
    type: {
        type: String,
        enum: {
            values: ['system', 'user'],
            message: 'El tipo debe ser "system" o "user"'
        },
        default: 'user'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    description: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true,
        maxlength: [200, 'La descripción no puede exceder 200 caracteres']
    },
    color: {
        type: String,
        required: [true, 'El color es requerido'],
        trim: true,
        maxlength: [7, 'El color debe tener al menos 7 caracteres']
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

export const Category = mongoose.model<categoriesInterfaces.ICategory>('Category', categorySchema);