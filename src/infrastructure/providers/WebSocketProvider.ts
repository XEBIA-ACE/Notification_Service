import { Server as SocketIOServer } from 'socket.io';
import { INotificationProvider, NotificationResult } from '../../domain/interfaces/INotificationProvider';
import { Notification, NotificationChannel } from '../../domain/entities/Notification';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * WebSocket notification provider using Socket.IO
 */
export class WebSocketProvider implements INotificationProvider {
  private configured: boolean = false;

  constructor(
    private readonly io: SocketIOServer | null,
    private readonly logger: ILogger
  ) {
    this.configured = !!io;
  }

  async send(notification: Notification): Promise<NotificationResult> {
    try {
      if (!this.io) {
        throw new Error('Socket.IO server not initialized');
      }

      const room = `user:${notification.userId}`;

      const payload = {
        id: notification.id,
        type: notification.type,
        subject: notification.subject,
        content: notification.content,
        priority: notification.priority,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      };

      // Emit to specific user room
      this.io.to(room).emit('notification', payload);

      this.logger.info('WebSocket notification sent', {
        notificationId: notification.id,
        userId: notification.userId,
        room,
      });

      return {
        success: true,
        externalId: `ws:${notification.id}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown WebSocket error';
      this.logger.error('WebSocket notification failed', error as Error, {
        notificationId: notification.id,
      });

      return {
        success: false,
        errorMessage,
      };
    }
  }

  supports(notification: Notification): boolean {
    return notification.channel === NotificationChannel.WEBSOCKET;
  }

  getName(): string {
    return 'WebSocket';
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Handle user connection to their notification room
   */
  handleConnection(socket: any, userId: string): void {
    const room = `user:${userId}`;
    socket.join(room);

    this.logger.info('User joined notification room', {
      userId,
      socketId: socket.id,
      room,
    });

    socket.on('disconnect', () => {
      this.logger.info('User disconnected from notification room', {
        userId,
        socketId: socket.id,
        room,
      });
    });
  }
}
