import * as admin from 'firebase-admin';
import { INotificationProvider, NotificationResult } from '../../domain/interfaces/INotificationProvider';
import { Notification, NotificationChannel } from '../../domain/entities/Notification';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * Firebase Cloud Messaging push notification provider
 */
export class FCMProvider implements INotificationProvider {
  private configured: boolean = false;

  constructor(
    private readonly projectId: string,
    private readonly privateKey: string,
    private readonly clientEmail: string,
    private readonly logger: ILogger
  ) {
    this.initialize();
  }

  private initialize(): void {
    try {
      if (!this.projectId || !this.privateKey || !this.clientEmail) {
        this.logger.warn('FCM credentials not configured');
        return;
      }

      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: this.projectId,
            privateKey: this.privateKey.replace(/\\n/g, '\n'),
            clientEmail: this.clientEmail,
          }),
        });
      }

      this.configured = true;
      this.logger.info('FCM Provider initialized');
    } catch (error) {
      this.logger.error('Failed to initialize FCM', error as Error);
      this.configured = false;
    }
  }

  async send(notification: Notification): Promise<NotificationResult> {
    try {
      if (!notification.metadata?.fcmToken) {
        throw new Error('FCM token not provided in metadata');
      }

      const message: admin.messaging.Message = {
        token: notification.metadata.fcmToken as string,
        notification: {
          title: notification.subject || 'Notification',
          body: notification.content,
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
          ...(notification.metadata as Record<string, string>),
        },
        android: {
          priority: this.getAndroidPriority(notification.priority),
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
      };

      const messageId = await admin.messaging().send(message);

      this.logger.info('Push notification sent via FCM', {
        notificationId: notification.id,
        messageId,
      });

      return {
        success: true,
        externalId: messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown FCM error';
      this.logger.error('FCM push notification failed', error as Error, {
        notificationId: notification.id,
      });

      return {
        success: false,
        errorMessage,
      };
    }
  }

  supports(notification: Notification): boolean {
    return notification.channel === NotificationChannel.PUSH;
  }

  getName(): string {
    return 'Firebase Cloud Messaging';
  }

  isConfigured(): boolean {
    return this.configured;
  }

  private getAndroidPriority(priority: string): 'high' | 'normal' {
    return priority === 'HIGH' || priority === 'URGENT' ? 'high' : 'normal';
  }
}
