# ⏰ Cron Jobs

El sistema ejecuta tareas programadas automáticamente usando `node-cron`.

## Limpieza de Cuentas Inactivas

**Archivo**: `src/jobs/cleanupInactiveAccounts.ts`

### Programación

- **Frecuencia**: Diario
- **Hora**: 3:00 AM (America/Mexico_City)
- **Expresión cron**: `0 3 * * *`

### Cuentas que se eliminan

El job elimina cuentas que cumplen alguna de las siguientes condiciones:

| Condición | Tiempo de gracia |
|-----------|------------------|
| Suscripción `incomplete`, `canceled` o `unpaid` | 30 días |
| Período de prueba expirado sin suscripción activa | 30 días |
| Email no verificado | 30 días |

> ⚠️ Los usuarios pueden reactivar su cuenta iniciando una nueva suscripción antes de que se cumpla el plazo de 30 días.

### Lógica de eliminación

```typescript
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 30);

await User.deleteMany({
  $or: [
    // Cuentas con suscripción cancelada/incompleta/impaga
    {
      subscriptionStatus: { $in: ['incomplete', 'canceled', 'unpaid'] },
      updatedAt: { $lt: cutoffDate }
    },
    // Cuentas con período de prueba expirado
    {
      subscriptionStatus: 'trialing',
      subscriptionCurrentPeriodEnd: { $lt: cutoffDate }
    },
    // Cuentas sin verificar email
    {
      isVerified: false,
      createdAt: { $lt: cutoffDate }
    }
  ]
});
```

### Ejecución manual

Para ejecutar la limpieza manualmente (útil para testing):

```typescript
import { runCleanupNow } from './jobs/cleanupInactiveAccounts';

const result = await runCleanupNow();
console.log(`Eliminadas: ${result.deletedCount} cuentas`);
```

### Logs

El job registra su actividad en los logs:

```
[ 2025-01-15 03:00:00 UTC-6 | cleanupInactiveA… ] INFO   : Iniciando limpieza de cuentas inactivas...
[ 2025-01-15 03:00:01 UTC-6 | cleanupInactiveA… ] INFO   : Se eliminaron 5 cuentas inactivas
```

## Agregar nuevos jobs

Para agregar un nuevo job:

1. Crear archivo en `src/jobs/`
2. Exportar la función de inicio
3. Registrar en `src/jobs/index.ts`
4. Iniciar desde `server.ts`

```typescript
// src/jobs/miNuevoJob.ts
import cron from 'node-cron';
import { logger } from '../utils/logger';

export const startMiNuevoJob = (): cron.ScheduledTask => {
  return cron.schedule('0 0 * * *', async () => {
    logger.info('Ejecutando mi nuevo job...');
    // Lógica del job
  }, {
    scheduled: true,
    timezone: 'America/Mexico_City'
  });
};
```
