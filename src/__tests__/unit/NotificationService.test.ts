import { NotificationService } from '../../application/services/NotificationService';
import { INotificationRepository } from '../../domain/interfaces/INotificationRepository';
import { INotificationProvider } from '../../domain/interfaces/INotificationProvider';
import { ILogger } from '../../domain/interfaces/ILogger';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
} from '../../domain/entities/Notification';

// Mock implementations
const mockRepository: jest.Mocked<INotificationRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByStatus: jest.fn(),
  findPendingNotifications: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  countByStatus: jest.fn(),
  countByUserId: jest.fn(),
};

const mockProvider: jest.Mocked<INotificationProvider> = {
  send: jest.fn(),
  supports: jest.fn(),
  getName: jest.fn().mockReturnValue('MockProvider'),
  isConfigured: jest.fn().mockReturnValue(true),
};

const mockLogger: jest.Mocked<ILogger> = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService(mockRepository, [mockProvider], mockLogger, 3);
  });

  describe('createNotification', () => {
    it('should create and save a notification', async () => {
      const dto = {
        userId: 'user-123',
        channel: NotificationChannel.EMAIL,
        type: 'welcome',
        content: 'Welcome!',
        priority: NotificationPriority.NORMAL,
      };

      const savedNotification = new Notification(
        'notif-123',
        dto.userId,
        dto.channel,
        dto.type,
        dto.content,
        NotificationStatus.PENDING,
        undefined,
        undefined,
        dto.priority
      );

      mockRepository.save.mockResolvedValue(savedNotification);

      const result = await service.createNotification(dto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('notif-123');
      expect(result.userId).toBe(dto.userId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating notification',
        expect.any(Object)
      );
    });
  });

  describe('processNotification', () => {
    it('should process and send a notification successfully', async () => {
      const notification = new Notification(
        'notif-123',
        'user-123',
        NotificationChannel.EMAIL,
        'welcome',
        'Welcome!',
        NotificationStatus.PENDING
      );

      mockRepository.findById.mockResolvedValue(notification);
      mockRepository.update.mockResolvedValue(notification);
      mockProvider.supports.mockReturnValue(true);
      mockProvider.send.mockResolvedValue({
        success: true,
        externalId: 'ext-123',
      });

      await service.processNotification('notif-123');

      expect(mockRepository.findById).toHaveBeenCalledWith('notif-123');
      expect(mockProvider.send).toHaveBeenCalledWith(notification);
      expect(mockRepository.update).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Notification sent successfully',
        expect.any(Object)
      );
    });

    it('should handle send failure and mark as failed', async () => {
      const notification = new Notification(
        'notif-123',
        'user-123',
        NotificationChannel.EMAIL,
        'welcome',
        'Welcome!',
        NotificationStatus.PENDING
      );

      mockRepository.findById.mockResolvedValue(notification);
      mockRepository.update.mockResolvedValue(notification);
      mockProvider.supports.mockReturnValue(true);
      mockProvider.send.mockResolvedValue({
        success: false,
        errorMessage: 'Send failed',
      });

      await service.processNotification('notif-123');

      expect(notification.status).toBe(NotificationStatus.FAILED);
      expect(notification.retryCount).toBe(1);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw error if notification not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.processNotification('notif-123')).rejects.toThrow(
        'Notification not found: notif-123'
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const notifications = [
        new Notification(
          'notif-1',
          'user-123',
          NotificationChannel.EMAIL,
          'welcome',
          'Welcome!',
          NotificationStatus.SENT
        ),
      ];

      mockRepository.findByUserId.mockResolvedValue(notifications);

      const result = await service.getUserNotifications('user-123');

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123', 50, 0);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('notif-1');
    });
  });

  describe('getStatistics', () => {
    it('should return notification statistics', async () => {
      mockRepository.countByStatus.mockResolvedValue(10);

      const stats = await service.getStatistics();

      expect(stats).toHaveProperty('PENDING');
      expect(stats).toHaveProperty('SENT');
      expect(stats).toHaveProperty('FAILED');
    });
  });
});
