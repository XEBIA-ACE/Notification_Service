import { Request, Response, NextFunction } from 'express';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * Global error handler middleware
 */
export class ErrorHandler {
  constructor(private readonly logger: ILogger) {}

  handle() {
    return (error: Error, req: Request, res: Response, _next: NextFunction) => {
      this.logger.error('Unhandled error', error, {
        path: req.path,
        method: req.method,
        body: req.body,
      });

      // Don't expose internal errors in production
      const message =
        process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;

      res.status(500).json({
        success: false,
        error: message,
      });
    };
  }
}
