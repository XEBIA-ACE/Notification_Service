/**
 * Generic message queue interface for Kafka, RabbitMQ, etc.
 */
export interface IMessageQueue {
  /**
   * Connect to the message queue
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the message queue
   */
  disconnect(): Promise<void>;

  /**
   * Publish a message to the queue
   */
  publish(topic: string, message: unknown): Promise<void>;

  /**
   * Subscribe to a topic and process messages
   */
  subscribe(topic: string, handler: (message: unknown) => Promise<void>): Promise<void>;

  /**
   * Check if the queue is connected
   */
  isConnected(): boolean;
}
