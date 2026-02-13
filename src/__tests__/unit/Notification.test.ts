import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
} from '../../domain/entities/Notification';

describe('Notification Entity', () => {
  let notification: Notification;

  beforeEach(() => {
    notification = new Notification(
      'test-id',
      'user-123',
      NotificationChannel.EMAIL,
      'welcome',
      'Welcome to our service!',
      NotificationStatus.PENDING,
      'Welcome',
      { email: 'user@example.com' },
      NotificationPriority.NORMAL
    );
  });

  describe('markAsSent', () => {
    it('should mark notification as sent with timestamp', () => {
      const externalId = 'ext-123';
      notification.markAsSent(externalId);

      expect(notification.status).toBe(NotificationStatus.SENT);
      expect(notification.sentAt).toBeDefined();
      expect(notification.externalId).toBe(externalId);
    });

    it('should update the updatedAt timestamp', () => {
      const beforeUpdate = notification.updatedAt;
      notification.markAsSent();

      expect(notification.updatedAt.getTime()).toBeGreaterThan(beforeUpdate.getTime());
    });
  });

  describe('markAsFailed', () => {
    it('should mark notification as failed with error message', () => {
      const errorMessage = 'Failed to send email';
      notification.markAsFailed(errorMessage);

      expect(notification.status).toBe(NotificationStatus.FAILED);
      expect(notification.failedAt).toBeDefined();
      expect(notification.errorMessage).toBe(errorMessage);
    });
  });

  describe('incrementRetryCount', () => {
    it('should increment retry count', () => {
      const initialCount = notification.retryCount;
      notification.incrementRetryCount();

      expect(notification.retryCount).toBe(initialCount + 1);
    });
  });

  describe('canRetry', () => {
    it('should return true if retries are below max and status is failed', () => {
      notification.markAsFailed('Error');

      expect(notification.canRetry(3)).toBe(true);
    });

    it('should return false if retries exceed max', () => {
      notification.markAsFailed('Error');
      notification.retryCount = 3;

      expect(notification.canRetry(3)).toBe(false);
    });

    it('should return false if status is not failed', () => {
      notification.status = NotificationStatus.SENT;

      expect(notification.canRetry(3)).toBe(false);
    });
  });

  describe('shouldProcess', () => {
    it('should return true for pending notification without schedule', () => {
      expect(notification.shouldProcess()).toBe(true);
    });

    it('should return false for non-pending notification', () => {
      notification.status = NotificationStatus.SENT;

      expect(notification.shouldProcess()).toBe(false);
    });

    it('should return false if scheduled for future', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      notification.scheduledAt = futureDate;

      expect(notification.shouldProcess()).toBe(false);
    });

    it('should return true if scheduled time has passed', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);
      notification.scheduledAt = pastDate;

      expect(notification.shouldProcess()).toBe(true);
    });
  });
});
