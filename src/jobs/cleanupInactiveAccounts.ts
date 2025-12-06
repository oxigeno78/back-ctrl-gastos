import cron from 'node-cron';
import { User } from '../models/User';

/**
 * Job de limpieza de cuentas inactivas
 * 
 * Elimina cuentas que:
 * - Tienen estado de suscripción 'incomplete', 'canceled', o 'unpaid' por más de 30 días
 * - Tienen período de prueba expirado por más de 30 días sin suscripción activa
 * - Nunca completaron el registro (sin verificar email) por más de 30 días
 * 
 * Se ejecuta diariamente a las 3:00 AM
 */

const DAYS_BEFORE_CLEANUP = 30;

export const startCleanupJob = (): cron.ScheduledTask => {
  // Ejecutar diariamente a las 3:00 AM
  const task = cron.schedule('0 3 * * *', async () => {
    console.log('[CleanupJob] Iniciando limpieza de cuentas inactivas...');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - DAYS_BEFORE_CLEANUP);

      const result = await User.deleteMany({
        $or: [
          // Cuentas con suscripción cancelada, incompleta o impaga por más de 30 días
          {
            subscriptionStatus: { $in: ['incomplete', 'canceled', 'unpaid'] },
            updatedAt: { $lt: cutoffDate }
          },
          // Cuentas con período de prueba expirado hace más de 30 días sin suscripción activa
          {
            subscriptionStatus: 'trialing',
            subscriptionCurrentPeriodEnd: { $lt: cutoffDate }
          },
          // Cuentas sin verificar email por más de 30 días
          {
            isVerified: false,
            createdAt: { $lt: cutoffDate }
          }
        ]
      });

      console.log(`[CleanupJob] Se eliminaron ${result.deletedCount} cuentas inactivas`);
    } catch (error) {
      console.error('[CleanupJob] Error al limpiar cuentas inactivas:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/Mexico_City'
  });

  console.log('[CleanupJob] Job de limpieza programado (diario a las 3:00 AM)');
  
  return task;
};

/**
 * Ejecuta la limpieza manualmente (útil para testing o ejecución manual)
 */
export const runCleanupNow = async (): Promise<{ deletedCount: number }> => {
  console.log('[CleanupJob] Ejecutando limpieza manual...');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_BEFORE_CLEANUP);

  const result = await User.deleteMany({
    $or: [
      {
        subscriptionStatus: { $in: ['incomplete', 'canceled', 'unpaid'] },
        updatedAt: { $lt: cutoffDate }
      },
      {
        subscriptionStatus: 'trialing',
        subscriptionCurrentPeriodEnd: { $lt: cutoffDate }
      },
      {
        isVerified: false,
        createdAt: { $lt: cutoffDate }
      }
    ]
  });

  console.log(`[CleanupJob] Limpieza manual completada: ${result.deletedCount} cuentas eliminadas`);
  
  return { deletedCount: result.deletedCount };
};
