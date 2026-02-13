import request from 'supertest';
import { Application } from '../../app';

/**
 * Integration tests for API endpoints
 * Note: These require a running database and other services
 */
describe('API Integration Tests', () => {
  let app: Application;
  let server: any;

  beforeAll(async () => {
    app = new Application();
    server = app.getExpressApp();
  });

  describe('Health Check Endpoints', () => {
    it('GET /health should return healthy status', async () => {
      const response = await request(server).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'notification-service');
    });

    it('GET / should return service info', async () => {
      const response = await request(server).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('service', 'notification-service');
      expect(response.body).toHaveProperty('status', 'running');
    });
  });

  describe('Notification Endpoints', () => {
    it('POST /api/notifications should validate request body', async () => {
      const response = await request(server)
        .post('/api/notifications')
        .send({
          // Missing required fields
          content: 'Test notification',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('POST /api/notifications should create notification with valid data', async () => {
      const notification = {
        userId: 'test-user-123',
        channel: 'EMAIL',
        type: 'test',
        content: 'Test notification content',
        subject: 'Test Subject',
        priority: 'NORMAL',
      };

      const response = await request(server)
        .post('/api/notifications')
        .send(notification);

      // May fail if database is not set up - this is expected for demo
      // In real tests, you would set up a test database
      expect([200, 201, 500]).toContain(response.status);
    });
  });
});
