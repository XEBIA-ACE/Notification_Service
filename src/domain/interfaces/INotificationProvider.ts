import { Notification } from '../entities/Notification';

/**
 * Result of sending a notification through a provider
 */
export interface NotificationResult {
  success: boolean;
  externalId?: string;
  errorMessage?: string;
}

/**
 * Interface for notification providers (SendGrid, FCM, etc.)
 */
export interface INotificationProvider {
  /**
   * Send a notification through this provider
   */
  send(notification: Notification): Promise<NotificationResult>;

  /**
   * Check if this provider supports the notification
   */
  supports(notification: Notification): boolean;

  /**
   * Get the provider name
   */
  getName(): string;

  /**
   * Validate provider configuration
   */
  isConfigured(): boolean;
}
