import { Request, Response, NextFunction } from 'express';
import os from 'os';

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
    
    // Obtener información del sistema
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = Math.round((usedMemory / totalMemory) * 100);
    
    // Información de CPU
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    
    // Información de la plataforma
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    
    // Información de red
    const networkInterfaces = os.networkInterfaces();
    
    const metrics = {
      // Información básica del proceso
      uptime: Math.round(uptime),
      memoryUsageMB,
      memoryUsagePercent,
      
      // Información del sistema
      system: {
        platform,
        arch,
        hostname,
        totalMemoryMB: Math.round(totalMemory / 1024 / 1024),
        freeMemoryMB: Math.round(freeMemory / 1024 / 1024),
        cpuCount: cpus.length,
        cpuModel: cpus[0]?.model || 'Unknown',
        loadAverage: {
          '1min': Math.round(loadAverage[0] * 100) / 100,
          '5min': Math.round(loadAverage[1] * 100) / 100,
          '15min': Math.round(loadAverage[2] * 100) / 100
        }
      },
      
      // Información de la aplicación
      app: {
        nodeVersion: process.version,
        pid: process.pid,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      },
      
      // Estado de la base de datos (se puede expandir)
      dbStatus: 'connected', // Esto se puede hacer dinámico conectando a MongoDB
      
      // Información de red (simplificada)
      network: {
        interfaces: Object.keys(networkInterfaces).length
      }
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};
