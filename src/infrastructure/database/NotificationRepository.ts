import { PrismaClient } from '@prisma/client';
import { INotificationRepository } from '../../domain/interfaces/INotificationRepository';
import {
  Notification,
  NotificationStatus,
  NotificationChannel,
  NotificationPriority,
} from '../../domain/entities/Notification';

/**
 * Prisma implementation of notification repository
 */
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(notification: Notification): Promise<Notification> {
    const created = await this.prisma.notification.create({
      data: {
        id: notification.id,
        userId: notification.userId,
        channel: notification.channel as any,
        type: notification.type,
        subject: notification.subject,
        content: notification.content,
        metadata: notification.metadata as any,
        status: notification.status as any,
        priority: notification.priority as any,
        scheduledAt: notification.scheduledAt,
        sentAt: notification.sentAt,
        deliveredAt: notification.deliveredAt,
        failedAt: notification.failedAt,
        errorMessage: notification.errorMessage,
        retryCount: notification.retryCount,
        externalId: notification.externalId,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    return notification ? this.toDomain(notification) : null;
  }

  async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return notifications.map((n) => this.toDomain(n));
  }

  async findByStatus(status: NotificationStatus, limit: number = 100): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { status: status as any },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return notifications.map((n) => this.toDomain(n));
  }

  async findPendingNotifications(limit: number = 100): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        status: 'PENDING' as any,
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    return notifications.map((n) => this.toDomain(n));
  }

  async update(notification: Notification): Promise<Notification> {
    const updated = await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: notification.status as any,
        sentAt: notification.sentAt,
        deliveredAt: notification.deliveredAt,
        failedAt: notification.failedAt,
        errorMessage: notification.errorMessage,
        retryCount: notification.retryCount,
        externalId: notification.externalId,
        updatedAt: notification.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async countByStatus(status: NotificationStatus): Promise<number> {
    return await this.prisma.notification.count({
      where: { status: status as any },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: { userId },
    });
  }

  private toDomain(data: any): Notification {
    return new Notification(
      data.id,
      data.userId,
      data.channel as NotificationChannel,
      data.type,
      data.content,
      data.status as NotificationStatus,
      data.subject,
      data.metadata as any,
      data.priority as NotificationPriority,
      data.scheduledAt,
      data.sentAt,
      data.deliveredAt,
      data.failedAt,
      data.errorMessage,
      data.retryCount,
      data.externalId,
      data.createdAt,
      data.updatedAt
    );
  }
}
