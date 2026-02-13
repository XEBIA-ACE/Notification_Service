import pino from 'pino';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * Pino logger implementation
 */
export class Logger implements ILogger {
  private logger: pino.Logger;

  constructor(serviceName: string, logLevel: string = 'info') {
    this.logger = pino({
      name: serviceName,
      level: logLevel,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(meta, message);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.logger.error(
      {
        ...meta,
        error: error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : undefined,
      },
      message
    );
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(meta, message);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(meta, message);
  }

  getLogger(): pino.Logger {
    return this.logger;
  }
}
