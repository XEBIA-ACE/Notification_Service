import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationStatus } from '../../domain/entities/Notification';
import { INotificationRepository } from '../../domain/interfaces/INotificationRepository';
import { INotificationProvider } from '../../domain/interfaces/INotificationProvider';
import { ILogger } from '../../domain/interfaces/ILogger';
import { CreateNotificationDTO, NotificationResponseDTO } from '../dto/NotificationDTO';

/**
 * Application service for notification business logic
 */
export class NotificationService {
  constructor(
    private readonly repository: INotificationRepository,
    private readonly providers: INotificationProvider[],
    private readonly logger: ILogger,
    private readonly maxRetries: number = 3
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(dto: CreateNotificationDTO): Promise<NotificationResponseDTO> {
    this.logger.info('Creating notification', { userId: dto.userId, channel: dto.channel });

    const notification = new Notification(
      uuidv4(),
      dto.userId,
      dto.channel,
      dto.type,
      dto.content,
      NotificationStatus.PENDING,
      dto.subject,
      dto.metadata,
      dto.priority,
      dto.scheduledAt
    );

    const saved = await this.repository.save(notification);
    this.logger.info('Notification created', { notificationId: saved.id });

    return this.toDTO(saved);
  }

  /**
   * Process and send a notification
   */
  async processNotification(notificationId: string): Promise<void> {
    const notification = await this.repository.findById(notificationId);

    if (!notification) {
      this.logger.error('Notification not found', undefined, { notificationId });
      throw new Error(`Notification not found: ${notificationId}`);
    }

    if (!notification.shouldProcess()) {
      this.logger.info('Notification not ready to process', {
        notificationId,
        status: notification.status,
      });
      return;
    }

    notification.markAsProcessing();
    await this.repository.update(notification);

    try {
      const provider = this.getProvider(notification);

      if (!provider) {
        throw new Error(`No provider found for channel: ${notification.channel}`);
      }

      this.logger.info('Sending notification', {
        notificationId,
        provider: provider.getName(),
      });

      const result = await provider.send(notification);

      if (result.success) {
        notification.markAsSent(result.externalId);
        this.logger.info('Notification sent successfully', {
          notificationId,
          externalId: result.externalId,
        });
      } else {
        throw new Error(result.errorMessage || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      notification.markAsFailed(errorMessage);
      notification.incrementRetryCount();

      this.logger.error('Failed to send notification', error as Error, {
        notificationId,
        retryCount: notification.retryCount,
      });

      if (notification.canRetry(this.maxRetries)) {
        this.logger.info('Notification will be retried', {
          notificationId,
          retryCount: notification.retryCount,
        });
      }
    } finally {
      await this.repository.update(notification);
    }
  }

  /**
   * Get notification by ID
   */
  async getNotification(id: string): Promise<NotificationResponseDTO | null> {
    const notification = await this.repository.findById(id);
    return notification ? this.toDTO(notification) : null;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationResponseDTO[]> {
    const notifications = await this.repository.findByUserId(userId, limit, offset);
    return notifications.map((n) => this.toDTO(n));
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<void> {
    const failedNotifications = await this.repository.findByStatus(
      NotificationStatus.FAILED,
      100
    );

    for (const notification of failedNotifications) {
      if (notification.canRetry(this.maxRetries)) {
        notification.status = NotificationStatus.PENDING;
        await this.repository.update(notification);
        await this.processNotification(notification.id);
      }
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<Record<string, number>> {
    const statuses = Object.values(NotificationStatus);
    const stats: Record<string, number> = {};

    for (const status of statuses) {
      stats[status] = await this.repository.countByStatus(status);
    }

    return stats;
  }

  /**
   * Get appropriate provider for notification
   */
  private getProvider(notification: Notification): INotificationProvider | undefined {
    return this.providers.find((p) => p.supports(notification) && p.isConfigured());
  }

  /**
   * Convert entity to DTO
   */
  private toDTO(notification: Notification): NotificationResponseDTO {
    return {
      id: notification.id,
      userId: notification.userId,
      channel: notification.channel,
      type: notification.type,
      subject: notification.subject,
      content: notification.content,
      status: notification.status,
      priority: notification.priority,
      scheduledAt: notification.scheduledAt,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
      failedAt: notification.failedAt,
      errorMessage: notification.errorMessage,
      retryCount: notification.retryCount,
      externalId: notification.externalId,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
