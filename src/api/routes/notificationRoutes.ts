import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { NotificationController } from '../controllers/NotificationController';
import { validate } from '../middleware/validation';

/**
 * Notification API routes
 */
export function createNotificationRoutes(controller: NotificationController): Router {
  const router = Router();

  // Create notification
  router.post(
    '/',
    validate([
      body('userId').isString().notEmpty().withMessage('User ID is required'),
      body('channel')
        .isIn(['EMAIL', 'PUSH', 'WEBSOCKET', 'SMS'])
        .withMessage('Invalid channel'),
      body('type').isString().notEmpty().withMessage('Type is required'),
      body('content').isString().notEmpty().withMessage('Content is required'),
      body('subject').optional().isString(),
      body('metadata').optional().isObject(),
      body('priority')
        .optional()
        .isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
        .withMessage('Invalid priority'),
      body('scheduledAt').optional().isISO8601().toDate(),
    ]),
    controller.createNotification
  );

  // Get notification by ID
  router.get(
    '/:id',
    validate([param('id').isUUID().withMessage('Invalid notification ID')]),
    controller.getNotification
  );

  // Get user notifications
  router.get(
    '/user/:userId',
    validate([
      param('userId').isString().notEmpty().withMessage('User ID is required'),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
      query('offset').optional().isInt({ min: 0 }).toInt(),
    ]),
    controller.getUserNotifications
  );

  // Process notification
  router.post(
    '/:id/process',
    validate([param('id').isUUID().withMessage('Invalid notification ID')]),
    controller.processNotification
  );

  // Get statistics
  router.get('/stats', controller.getStatistics);

  return router;
}
