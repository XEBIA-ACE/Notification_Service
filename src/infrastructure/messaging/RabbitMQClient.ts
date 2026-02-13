import amqp, { Connection, Channel } from 'amqplib';
import { IMessageQueue } from '../../domain/interfaces/IMessageQueue';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * RabbitMQ client implementation
 */
export class RabbitMQClient implements IMessageQueue {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private connected: boolean = false;

  constructor(
    private readonly url: string,
    private readonly exchange: string,
    private readonly queue: string,
    private readonly routingKey: string,
    private readonly logger: ILogger
  ) {}

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });

      // Declare queue
      await this.channel.assertQueue(this.queue, {
        durable: true,
      });

      // Bind queue to exchange
      await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

      this.connected = true;
      this.logger.info('RabbitMQ connected', {
        exchange: this.exchange,
        queue: this.queue,
      });

      // Handle connection errors
      this.connection.on('error', (error) => {
        this.logger.error('RabbitMQ connection error', error);
        this.connected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.connected = false;
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.connected = false;
      this.logger.info('RabbitMQ disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error as Error);
    }
  }

  async publish(topic: string, message: unknown): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const content = Buffer.from(JSON.stringify(message));

    this.channel.publish(this.exchange, topic, content, {
      persistent: true,
      contentType: 'application/json',
    });

    this.logger.info('Message published to RabbitMQ', {
      exchange: this.exchange,
      routingKey: topic,
    });
  }

  async subscribe(topic: string, handler: (message: unknown) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    // Create a specific queue for this subscription
    const subscriptionQueue = `${this.queue}.${topic}`;
    await this.channel.assertQueue(subscriptionQueue, { durable: true });
    await this.channel.bindQueue(subscriptionQueue, this.exchange, topic);

    // Set prefetch to 1 to process one message at a time
    await this.channel.prefetch(1);

    await this.channel.consume(
      subscriptionQueue,
      async (msg) => {
        if (!msg) return;

        try {
          const content = msg.content.toString();
          const parsedMessage = JSON.parse(content);

          this.logger.info('Processing RabbitMQ message', {
            queue: subscriptionQueue,
            routingKey: msg.fields.routingKey,
          });

          await handler(parsedMessage);

          // Acknowledge message
          this.channel?.ack(msg);

          this.logger.info('RabbitMQ message processed successfully', {
            queue: subscriptionQueue,
          });
        } catch (error) {
          this.logger.error('Error processing RabbitMQ message', error as Error, {
            queue: subscriptionQueue,
          });

          // Reject and requeue the message
          this.channel?.nack(msg, false, true);
        }
      },
      {
        noAck: false,
      }
    );

    this.logger.info('Subscribed to RabbitMQ queue', {
      queue: subscriptionQueue,
      routingKey: topic,
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}
