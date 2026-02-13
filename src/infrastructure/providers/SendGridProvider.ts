import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { INotificationProvider, NotificationResult } from '../../domain/interfaces/INotificationProvider';
import { Notification, NotificationChannel } from '../../domain/entities/Notification';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * SendGrid email notification provider
 */
export class SendGridProvider implements INotificationProvider {
  private configured: boolean = false;

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
    private readonly fromName: string,
    private readonly logger: ILogger
  ) {
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.configured = true;
    }
  }

  async send(notification: Notification): Promise<NotificationResult> {
    try {
      if (!notification.metadata?.email) {
        throw new Error('Email address not provided in metadata');
      }

      const msg: MailDataRequired = {
        to: notification.metadata.email as string,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: notification.subject || 'Notification',
        text: notification.content,
        html: this.formatHtml(notification.content),
      };

      const [response] = await sgMail.send(msg);

      this.logger.info('Email sent via SendGrid', {
        notificationId: notification.id,
        messageId: response.headers['x-message-id'],
      });

      return {
        success: true,
        externalId: response.headers['x-message-id'] as string,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SendGrid error';
      this.logger.error('SendGrid email failed', error as Error, {
        notificationId: notification.id,
      });

      return {
        success: false,
        errorMessage,
      };
    }
  }

  supports(notification: Notification): boolean {
    return notification.channel === NotificationChannel.EMAIL;
  }

  getName(): string {
    return 'SendGrid';
  }

  isConfigured(): boolean {
    return this.configured;
  }

  private formatHtml(content: string): string {
    // Basic HTML formatting - can be enhanced with templates
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              ${content.replace(/\n/g, '<br>')}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
