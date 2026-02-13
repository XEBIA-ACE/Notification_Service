import { Router, Request, Response } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Initialize default metrics
collectDefaultMetrics();

// Custom metrics
export const notificationCounter = new Counter({
  name: 'notifications_total',
  help: 'Total number of notifications',
  labelNames: ['channel', 'status'],
});

export const notificationDuration = new Histogram({
  name: 'notification_processing_duration_seconds',
  help: 'Duration of notification processing',
  labelNames: ['channel'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

/**
 * Prometheus metrics routes
 */
export function createMetricsRoutes(): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  return router;
}
