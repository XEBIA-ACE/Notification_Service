import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * Health check routes
 */
export function createHealthRoutes(prisma: PrismaClient, logger: ILogger): Router {
  const router = Router();

  // Basic health check
  router.get('/', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'notification-service',
    });
  });

  // Detailed health check (readiness probe)
  router.get('/ready', async (_req: Request, res: Response) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'healthy',
        },
      });
    } catch (error) {
      logger.error('Health check failed', error as Error);
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'unhealthy',
        },
      });
    }
  });

  // Liveness probe
  router.get('/live', (_req: Request, res: Response) => {
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
