import mongoose, { Schema } from 'mongoose';
import { notificationsInterfaces } from '../interfaces';

const notificationSchema = new Schema<notificationsInterfaces.INotification>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  // Soporte para texto directo o claves de i18n
  title: { type: String },
  message: { type: String },
  titleKey: { type: String },
  messageKey: { type: String },
  messageParams: { type: Schema.Types.Mixed },
  link: String,
  read: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<notificationsInterfaces.INotification>('Notification', notificationSchema);