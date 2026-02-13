import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration
 */
export const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    serviceName: process.env.SERVICE_NAME || 'notification-service',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  database: {
    url: process.env.DATABASE_URL || '',
  },

  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
    groupId: process.env.KAFKA_GROUP_ID || 'notification-service-group',
    topicNotifications: process.env.KAFKA_TOPIC_NOTIFICATIONS || 'notifications',
    topicDLQ: process.env.KAFKA_TOPIC_DLQ || 'notifications-dlq',
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || '',
    fromName: process.env.SENDGRID_FROM_NAME || 'Notification Service',
  },

  fcm: {
    projectId: process.env.FCM_PROJECT_ID || '',
    privateKey: process.env.FCM_PRIVATE_KEY || '',
    clientEmail: process.env.FCM_CLIENT_EMAIL || '',
    credentialsPath: process.env.FCM_CREDENTIALS_PATH || '',
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'notifications',
    queue: process.env.RABBITMQ_QUEUE || 'notification-queue',
    routingKey: process.env.RABBITMQ_ROUTING_KEY || 'notification',
  },

  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT || '3001', 10),
    corsOrigin: process.env.WEBSOCKET_CORS_ORIGIN || 'http://localhost:3000',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  monitoring: {
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
    enableMetrics: process.env.ENABLE_METRICS === 'true',
  },

  retry: {
    maxAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    delayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const required = [
    { key: 'DATABASE_URL', value: config.database.url },
  ];

  const missing = required.filter((item) => !item.value);

  if (missing.length > 0) {
    throw new Error(
      `Missing required configuration: ${missing.map((item) => item.key).join(', ')}`
    );
  }
}
