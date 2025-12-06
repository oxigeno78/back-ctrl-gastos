/**
 * Logger personalizado con colores y formato enriquecido.
 * 
 * Uso:
 *   import { logger } from '@/utils/logger';
 *   logger.info('Mensaje informativo');
 *   logger.success('Operación exitosa');
 *   logger.debug('Datos de depuración', { user: 'test' });
 *   logger.warn('Advertencia importante');
 *   logger.error('Error crítico', new Error('Algo falló'));
 */

// Códigos ANSI para colores
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Colores de texto
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
} as const;

// Configuración de niveles de log
const levels = {
  info: { color: colors.cyan, label: 'INFO   ' },
  success: { color: colors.green, label: 'SUCCESS' },
  debug: { color: colors.gray, label: 'DEBUG  ' },
  warn: { color: colors.yellow, label: 'WARN   ' },
  error: { color: colors.red, label: 'ERROR  ' },
} as const;

type LogLevel = keyof typeof levels;

/**
 * Obtiene la marca de tiempo en formato YYYY-MM-DD HH:mm:ss UTC±X
 */
function getTimestamp(): string {
  const now = new Date();
  
  // Formato YYYY-MM-DD HH:mm:ss
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Calcular offset UTC en horas
  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = -offsetMinutes / 60;
  const offsetSign = offsetHours >= 0 ? '+' : '';
  const offsetStr = `UTC${offsetSign}${offsetHours}`;
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${offsetStr}`;
}

const FILE_NAME_MAX_LENGTH = 20;

/**
 * Formatea el nombre del archivo a longitud fija (30 caracteres)
 * - Si es menor: rellena con espacios a la derecha
 * - Si es mayor: trunca y agrega "…" al final
 */
function formatFileName(name: string): string {
  if (name.length > FILE_NAME_MAX_LENGTH) {
    return name.slice(0, FILE_NAME_MAX_LENGTH - 1) + '…';
  }
  return name.padEnd(FILE_NAME_MAX_LENGTH);
}

/**
 * Extrae el nombre del archivo desde el stack trace
 */
function getCallerFile(): string {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  
  try {
    const err = new Error();
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = err.stack as unknown as NodeJS.CallSite[];
    Error.prepareStackTrace = originalPrepareStackTrace;
    
    // Buscar el primer archivo que no sea logger.ts
    for (let i = 0; i < stack.length; i++) {
      const fileName = stack[i].getFileName();
      if (fileName && !fileName.includes('logger.ts')) {
        // Extraer solo el nombre del archivo
        const parts = fileName.split('/');
        const baseName = parts[parts.length - 1] || 'unknown';
        return formatFileName(baseName);
      }
    }
  } catch {
    Error.prepareStackTrace = originalPrepareStackTrace;
  }
  
  return formatFileName('unknown');
}

/**
 * Formatea argumentos para impresión
 */
function formatArgs(args: unknown[]): string {
  return args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.message}\n${colors.dim}${arg.stack}${colors.reset}`;
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
}

/**
 * Función principal de logging
 */
function log(level: LogLevel, ...args: unknown[]): void {
  const { color, label } = levels[level];
  const timestamp = getTimestamp();
  const callerFile = getCallerFile();
  const formattedArgs = formatArgs(args);
  
  // Formato: [ TIMESTAMP | archivo.ts ] LEVEL: mensaje
  const prefix = `${colors.gray}[ ${timestamp} | ${colors.magenta}${callerFile}${colors.gray} ]${colors.reset}`;
  const levelTag = `${color}${colors.bright}${label}${colors.reset}`;
  const message = `${color}${formattedArgs}${colors.reset}`;
  
  console.log(`${prefix} ${levelTag}: ${message}`);
}

/**
 * Logger exportable con métodos info, success, debug, warn, error
 */
export const logger = {
  /**
   * Log informativo (cyan)
   * @example logger.info('Servidor iniciado en puerto', 5000);
   */
  info: (...args: unknown[]) => log('info', ...args),
  
  /**
   * Log de éxito (verde)
   * @example logger.success('Operación completada correctamente');
   */
  success: (...args: unknown[]) => log('success', ...args),
  
  /**
   * Log de depuración (gris)
   * @example logger.debug('Datos recibidos:', { user: 'test' });
   */
  debug: (...args: unknown[]) => log('debug', ...args),
  
  /**
   * Log de advertencia (amarillo)
   * @example logger.warn('Conexión lenta detectada');
   */
  warn: (...args: unknown[]) => log('warn', ...args),
  
  /**
   * Log de error (rojo)
   * @example logger.error('Error en base de datos', error);
   */
  error: (...args: unknown[]) => log('error', ...args),
};

export default logger;
