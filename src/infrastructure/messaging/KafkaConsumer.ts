import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { IMessageQueue } from '../../domain/interfaces/IMessageQueue';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * Kafka consumer implementation
 */
export class KafkaConsumer implements IMessageQueue {
  private kafka: Kafka;
  private consumer: Consumer | null = null;
  private connected: boolean = false;

  constructor(
    private readonly brokers: string[],
    private readonly clientId: string,
    private readonly groupId: string,
    private readonly logger: ILogger
  ) {
    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers,
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });
  }

  async connect(): Promise<void> {
    try {
      this.consumer = this.kafka.consumer({ groupId: this.groupId });
      await this.consumer.connect();
      this.connected = true;
      this.logger.info('Kafka consumer connected', {
        brokers: this.brokers,
        groupId: this.groupId,
      });
    } catch (error) {
      this.logger.error('Failed to connect Kafka consumer', error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.connected = false;
      this.logger.info('Kafka consumer disconnected');
    }
  }

  async publish(topic: string, message: unknown): Promise<void> {
    // Kafka consumers don't publish - use KafkaProducer instead
    throw new Error('Use KafkaProducer for publishing messages');
  }

  async subscribe(topic: string, handler: (message: unknown) => Promise<void>): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not initialized. Call connect() first.');
    }

    await this.consumer.subscribe({ topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const messageValue = payload.message.value?.toString();
          if (!messageValue) {
            this.logger.warn('Received empty message', { topic, partition: payload.partition });
            return;
          }

          const parsedMessage = JSON.parse(messageValue);

          this.logger.info('Processing Kafka message', {
            topic,
            partition: payload.partition,
            offset: payload.message.offset,
          });

          await handler(parsedMessage);

          this.logger.info('Kafka message processed successfully', {
            topic,
            offset: payload.message.offset,
          });
        } catch (error) {
          this.logger.error('Error processing Kafka message', error as Error, {
            topic,
            partition: payload.partition,
            offset: payload.message.offset,
          });
          // In production, you might want to send to DLQ here
          throw error;
        }
      },
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Kafka producer for publishing messages
 */
export class KafkaProducer {
  private kafka: Kafka;
  private producer: any;
  private connected: boolean = false;

  constructor(
    private readonly brokers: string[],
    private readonly clientId: string,
    private readonly logger: ILogger
  ) {
    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers,
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    this.connected = true;
    this.logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    this.connected = false;
    this.logger.info('Kafka producer disconnected');
  }

  async publish(topic: string, message: unknown): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });

    this.logger.info('Message published to Kafka', { topic });
  }

  isConnected(): boolean {
    return this.connected;
  }
}
