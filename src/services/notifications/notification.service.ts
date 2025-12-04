import { rabbitMQService } from './rabbitmq.service';

export const notificationService = {
  // Notificar transacción creada
  async transactionCreated(userId: string, amount: number, type: 'income' | 'expense') {
    await rabbitMQService.publishNotification(userId, {
      type: 'success',
      titleKey: 'notifications.messages.transactionCreatedTitle',
      messageKey: 'notifications.messages.transactionCreatedMessage',
      messageParams: { type, amount },
      link: '/dashboard/transactions'
    });
  },

  // Alerta de presupuesto
  async budgetAlert(userId: string, percentage: number) {
    await rabbitMQService.publishNotification(userId, {
      type: 'warning',
      titleKey: 'notifications.messages.budgetAlertTitle',
      messageKey: 'notifications.messages.budgetAlertMessage',
      messageParams: { percentage },
      link: '/dashboard/reports'
    });
  },

  // Transacción periódica ejecutada
  async periodicTransactionExecuted(userId: string, description: string) {
    await rabbitMQService.publishNotification(userId, {
      type: 'info',
      titleKey: 'notifications.messages.periodicTransactionExecutedTitle',
      messageKey: 'notifications.messages.periodicTransactionExecutedMessage',
      messageParams: { description },
      link: '/dashboard/transactions',
    });
  },

  // Transacción actualizada
  async transactionUpdated(userId: string, amount: number, type: 'income' | 'expense') {
    await rabbitMQService.publishNotification(userId, {
      type: 'success',
      titleKey: 'notifications.messages.transactionUpdatedTitle',
      messageKey: 'notifications.messages.transactionUpdatedMessage',
      messageParams: { type, amount },
      link: '/dashboard/transactions'
    });
  },
};