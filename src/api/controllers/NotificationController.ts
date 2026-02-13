import { Request, Response } from 'express';
import { NotificationService } from '../../application/services/NotificationService';
import { CreateNotificationDTO } from '../../application/dto/NotificationDTO';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * REST API controller for notifications
 */
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly logger: ILogger
  ) {}

  /**
   * POST /api/notifications
   * Create a new notification
   */
  createNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CreateNotificationDTO = req.body;
      const notification = await this.notificationService.createNotification(dto);

      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      this.logger.error('Error creating notification', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to create notification',
      });
    }
  };

  /**
   * GET /api/notifications/:id
   * Get notification by ID
   */
  getNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.getNotification(id);

      if (!notification) {
        res.status(404).json({
          success: false,
          error: 'Notification not found',
        });
        return;
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      this.logger.error('Error fetching notification', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notification',
      });
    }
  };

  /**
   * GET /api/notifications/user/:userId
   * Get notifications for a user
   */
  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await this.notificationService.getUserNotifications(
        userId,
        limit,
        offset
      );

      res.json({
        success: true,
        data: notifications,
        pagination: {
          limit,
          offset,
          total: notifications.length,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching user notifications', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications',
      });
    }
  };

  /**
   * POST /api/notifications/:id/process
   * Process a notification (send it)
   */
  processNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.notificationService.processNotification(id);

      res.json({
        success: true,
        message: 'Notification processing initiated',
      });
    } catch (error) {
      this.logger.error('Error processing notification', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to process notification',
      });
    }
  };

  /**
   * GET /api/notifications/stats
   * Get notification statistics
   */
  getStatistics = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.notificationService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      this.logger.error('Error fetching statistics', error as Error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  };
}
