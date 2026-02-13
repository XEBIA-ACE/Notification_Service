import { NotificationChannel, NotificationPriority } from '../../domain/entities/Notification';

/**
 * Data Transfer Object for creating notifications
 */
export interface CreateNotificationDTO {
  userId: string;
  channel: NotificationChannel;
  type: string;
  subject?: string;
  content: string;
  metadata?: Record<string, unknown>;
  priority?: NotificationPriority;
  scheduledAt?: Date;
}

/**
 * Data Transfer Object for notification responses
 */
export interface NotificationResponseDTO {
  id: string;
  userId: string;
  channel: NotificationChannel;
  type: string;
  subject?: string;
  content: string;
  status: string;
  priority: NotificationPriority;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data Transfer Object for bulk notifications
 */
export interface BulkNotificationDTO {
  userIds: string[];
  channel: NotificationChannel;
  type: string;
  subject?: string;
  content: string;
  metadata?: Record<string, unknown>;
  priority?: NotificationPriority;
}
