import { Notification, NotificationStatus } from '../entities/Notification';

/**
 * Repository interface for notification persistence
 */
export interface INotificationRepository {
  /**
   * Save a notification
   */
  save(notification: Notification): Promise<Notification>;

  /**
   * Find notification by ID
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * Find notifications by user ID
   */
  findByUserId(userId: string, limit?: number, offset?: number): Promise<Notification[]>;

  /**
   * Find notifications by status
   */
  findByStatus(status: NotificationStatus, limit?: number): Promise<Notification[]>;

  /**
   * Find pending notifications that are ready to be sent
   */
  findPendingNotifications(limit?: number): Promise<Notification[]>;

  /**
   * Update notification
   */
  update(notification: Notification): Promise<Notification>;

  /**
   * Delete notification
   */
  delete(id: string): Promise<void>;

  /**
   * Count notifications by status
   */
  countByStatus(status: NotificationStatus): Promise<number>;

  /**
   * Count notifications by user
   */
  countByUserId(userId: string): Promise<number>;
}
