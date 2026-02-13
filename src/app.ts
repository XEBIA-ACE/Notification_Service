import express, { Express } from 'express';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Logger } from './infrastructure/logging/Logger';
import { NotificationRepository } from './infrastructure/database/NotificationRepository';
import { NotificationService } from './application/services/NotificationService';
import { NotificationController } from './api/controllers/NotificationController';
import { ErrorHandler } from './api/middleware/errorHandler';
import { SendGridProvider } from './infrastructure/providers/SendGridProvider';
import { FCMProvider } from './infrastructure/providers/FCMProvider';
import { WebSocketProvider } from './infrastructure/providers/WebSocketProvider';
import { KafkaConsumer, KafkaProducer } from './infrastructure/messaging/KafkaConsumer';
import { RabbitMQClient } from './infrastructure/messaging/RabbitMQClient';
import { createNotificationRoutes } from './api/routes/notificationRoutes';
import { createHealthRoutes } from './api/routes/healthRoutes';
import { createMetricsRoutes } from './api/routes/metricsRoutes';
import { config, validateConfig } from './config/config';
import { ILogger } from './domain/interfaces/ILogger';

/**
 * Main application class
 */
export class Application {
  private app: Express;
  private server: HTTPServer | null = null;
  private io: SocketIOServer | null = null;
  private prisma: PrismaClient;
  private logger: ILogger;
  private kafkaConsumer: KafkaConsumer | null = null;
  private kafkaProducer: KafkaProducer | null = null;
  private rabbitmqClient: RabbitMQClient | null = null;

  constructor() {
    // Validate configuration
    validateConfig();

    // Initialize logger
    this.logger = new Logger(config.app.serviceName, config.app.logLevel);

    // Initialize Prisma
    this.prisma = new PrismaClient({
      log: config.app.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Initialize Express app
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet());

    // Parse JSON bodies
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, _res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        query: req.query,
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Initialize services and controllers
    const repository = new NotificationRepository(this.prisma);

    const providers = [
      new SendGridProvider(
        config.sendgrid.apiKey,
        config.sendgrid.fromEmail,
        config.sendgrid.fromName,
        this.logger
      ),
      new FCMProvider(
        config.fcm.projectId,
        config.fcm.privateKey,
        config.fcm.clientEmail,
        this.logger
      ),
      new WebSocketProvider(this.io, this.logger),
    ];

    const notificationService = new NotificationService(
      repository,
      providers,
      this.logger,
      config.retry.maxAttempts
    );

    const notificationController = new NotificationController(notificationService, this.logger);

    // Mount routes
    this.app.use('/api/notifications', createNotificationRoutes(notificationController));
    this.app.use('/health', createHealthRoutes(this.prisma, this.logger));

    if (config.monitoring.enableMetrics) {
      this.app.use('/metrics', createMetricsRoutes());
    }

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        service: config.app.serviceName,
        version: '1.0.0',
        status: 'running',
      });
    });
  }

  private setupErrorHandling(): void {
    const errorHandler = new ErrorHandler(this.logger);
    this.app.use(errorHandler.handle());
  }

  private async setupWebSocket(): Promise<void> {
    if (!this.server) {
      throw new Error('HTTP server not initialized');
    }

    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.websocket.corsOrigin,
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      this.logger.info('WebSocket client connected', { socketId: socket.id });

      // Authenticate and join user room
      socket.on('authenticate', (data: { userId: string }) => {
        const webSocketProvider = new WebSocketProvider(this.io, this.logger);
        webSocketProvider.handleConnection(socket, data.userId);
      });

      socket.on('disconnect', () => {
        this.logger.info('WebSocket client disconnected', { socketId: socket.id });
      });
    });

    this.logger.info('WebSocket server initialized');
  }

  private async setupKafka(): Promise<void> {
    try {
      // Initialize Kafka consumer
      this.kafkaConsumer = new KafkaConsumer(
        config.kafka.brokers,
        config.kafka.clientId,
        config.kafka.groupId,
        this.logger
      );

      await this.kafkaConsumer.connect();

      // Initialize Kafka producer
      this.kafkaProducer = new KafkaProducer(
        config.kafka.brokers,
        config.kafka.clientId,
        this.logger
      );

      await this.kafkaProducer.connect();

      // Subscribe to notifications topic
      const repository = new NotificationRepository(this.prisma);
      const providers = [
        new SendGridProvider(
          config.sendgrid.apiKey,
          config.sendgrid.fromEmail,
          config.sendgrid.fromName,
          this.logger
        ),
        new FCMProvider(
          config.fcm.projectId,
          config.fcm.privateKey,
          config.fcm.clientEmail,
          this.logger
        ),
        new WebSocketProvider(this.io, this.logger),
      ];

      const notificationService = new NotificationService(
        repository,
        providers,
        this.logger,
        config.retry.maxAttempts
      );

      await this.kafkaConsumer.subscribe(config.kafka.topicNotifications, async (message: any) => {
        this.logger.info('Processing notification from Kafka', { message });
        await notificationService.processNotification(message.notificationId);
      });

      this.logger.info('Kafka consumer and producer initialized');
    } catch (error) {
      this.logger.error('Failed to setup Kafka', error as Error);
      // Don't throw - allow app to run without Kafka
    }
  }

  private async setupRabbitMQ(): Promise<void> {
    try {
      this.rabbitmqClient = new RabbitMQClient(
        config.rabbitmq.url,
        config.rabbitmq.exchange,
        config.rabbitmq.queue,
        config.rabbitmq.routingKey,
        this.logger
      );

      await this.rabbitmqClient.connect();
      this.logger.info('RabbitMQ client initialized');
    } catch (error) {
      this.logger.error('Failed to setup RabbitMQ', error as Error);
      // Don't throw - allow app to run without RabbitMQ
    }
  }

  async start(): Promise<void> {
    try {
      // Connect to database
      await this.prisma.$connect();
      this.logger.info('Database connected');

      // Start HTTP server
      this.server = this.app.listen(config.app.port, () => {
        this.logger.info(`Server running on port ${config.app.port}`, {
          port: config.app.port,
          env: config.app.env,
        });
      });

      // Setup WebSocket
      await this.setupWebSocket();

      // Setup message queues
      await this.setupKafka();
      await this.setupRabbitMQ();

      // Graceful shutdown handlers
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
    } catch (error) {
      this.logger.error('Failed to start application', error as Error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down gracefully...');

    try {
      // Close message queues
      if (this.kafkaConsumer) {
        await this.kafkaConsumer.disconnect();
      }
      if (this.kafkaProducer) {
        await this.kafkaProducer.disconnect();
      }
      if (this.rabbitmqClient) {
        await this.rabbitmqClient.disconnect();
      }

      // Close WebSocket
      if (this.io) {
        this.io.close();
      }

      // Close HTTP server
      if (this.server) {
        this.server.close();
      }

      // Disconnect database
      await this.prisma.$disconnect();

      this.logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown', error as Error);
      process.exit(1);
    }
  }

  getExpressApp(): Express {
    return this.app;
  }
}
