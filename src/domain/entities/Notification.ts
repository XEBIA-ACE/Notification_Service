/**
 * Core domain entity representing a notification
 */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  WEBSOCKET = 'WEBSOCKET',
  SMS = 'SMS',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface NotificationMetadata {
  [key: string]: unknown;
}

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly channel: NotificationChannel,
    public readonly type: string,
    public readonly content: string,
    public status: NotificationStatus,
    public readonly subject?: string,
    public readonly metadata?: NotificationMetadata,
    public readonly priority: NotificationPriority = NotificationPriority.NORMAL,
    public scheduledAt?: Date,
    public sentAt?: Date,
    public deliveredAt?: Date,
    public failedAt?: Date,
    public errorMessage?: string,
    public retryCount: number = 0,
    public externalId?: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  markAsSent(externalId?: string): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    this.updatedAt = new Date();
    if (externalId) {
      this.externalId = externalId;
    }
  }

  markAsDelivered(): void {
    this.status = NotificationStatus.DELIVERED;
    this.deliveredAt = new Date();
    this.updatedAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = NotificationStatus.FAILED;
    this.failedAt = new Date();
    this.errorMessage = errorMessage;
    this.updatedAt = new Date();
  }

  markAsProcessing(): void {
    this.status = NotificationStatus.PROCESSING;
    this.updatedAt = new Date();
  }

  incrementRetryCount(): void {
    this.retryCount++;
    this.updatedAt = new Date();
  }

  canRetry(maxRetries: number): boolean {
    return this.retryCount < maxRetries && this.status === NotificationStatus.FAILED;
  }

  isScheduled(): boolean {
    return !!this.scheduledAt && this.scheduledAt > new Date();
  }

  shouldProcess(): boolean {
    if (this.status !== NotificationStatus.PENDING) {
      return false;
    }
    if (this.scheduledAt) {
      return this.scheduledAt <= new Date();
    }
    return true;
  }
}
