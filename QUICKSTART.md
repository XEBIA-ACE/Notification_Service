# Quick Start Guide

Get the Notification Service up and running in 5 minutes!

## Prerequisites

Make sure you have installed:
- **Node.js 18+**: [Download](https://nodejs.org/)
- **Docker & Docker Compose**: [Download](https://www.docker.com/get-started)

## Step 1: Clone & Install

```bash
# Navigate to project directory
cd notification-service

# Install dependencies
npm install
```

## Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your favorite editor
nano .env
```

Minimum required configuration:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/notifications?schema=public
```

Optional (for full functionality):
```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@example.com
FCM_PROJECT_ID=your-firebase-project-id
```

## Step 3: Start Infrastructure

```bash
# Start PostgreSQL, Kafka, RabbitMQ, Redis
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Kafka on port 9092
- RabbitMQ on port 5672 (Management UI: 15672)
- Redis on port 6379
- Kafka UI on port 8080

## Step 4: Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run migrate:dev
```

## Step 5: Start the Service

```bash
# Development mode (with hot reload)
npm run dev
```

The service will start on:
- HTTP API: http://localhost:3000
- WebSocket: http://localhost:3001
- Metrics: http://localhost:9090

## Step 6: Test It!

### Check Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "notification-service"
}
```

### Send a Test Notification

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "channel": "WEBSOCKET",
    "type": "test",
    "subject": "Test Notification",
    "content": "This is a test notification!",
    "priority": "NORMAL"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "userId": "user-123",
    "status": "PENDING",
    ...
  }
}
```

### Get Notification

```bash
curl http://localhost:3000/api/notifications/{notification-id}
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run migrate:dev      # Run migrations (dev)
npm run migrate          # Run migrations (prod)
npm run db:studio        # Open Prisma Studio

# Testing
npm test                 # Run tests with coverage
npm run test:watch       # Run tests in watch mode
npm run test:integration # Run integration tests

# Code Quality
npm run lint             # Check code style
npm run lint:fix         # Fix code style issues
npm run format           # Format code with Prettier

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
docker-compose ps        # Check service status
```

## Access UIs

- **RabbitMQ Management**: http://localhost:15672
  - Username: `guest`
  - Password: `guest`

- **Kafka UI**: http://localhost:8080

- **Prisma Studio**: `npm run db:studio` then http://localhost:5555

- **Prometheus**: http://localhost:9091 (if running)

## What's Next?

### 1. Configure Notification Providers

To send actual emails and push notifications, configure:

**SendGrid (Email)**:
```env
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Firebase (Push)**:
```env
FCM_PROJECT_ID=your-project-id
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FCM_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
```

### 2. Test Different Channels

**Email Notification**:
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "channel": "EMAIL",
    "type": "welcome",
    "subject": "Welcome!",
    "content": "Thanks for joining!",
    "metadata": {
      "email": "user@example.com"
    }
  }'
```

**Push Notification**:
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "channel": "PUSH",
    "type": "alert",
    "subject": "New Message",
    "content": "You have a new message",
    "metadata": {
      "fcmToken": "device-token-here"
    }
  }'
```

### 3. Connect to WebSocket

Create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Notification Test</title>
  <script src="https://cdn.socket.io/4.6.0/socket.io.min.js"></script>
</head>
<body>
  <h1>Notification Service Test</h1>
  <div id="notifications"></div>

  <script>
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      console.log('Connected!');
      socket.emit('authenticate', { userId: 'user-123' });
    });

    socket.on('notification', (notification) => {
      console.log('Received:', notification);
      document.getElementById('notifications').innerHTML +=
        `<p><strong>${notification.subject}</strong>: ${notification.content}</p>`;
    });
  </script>
</body>
</html>
```

### 4. Explore the API

- Read `API.md` for complete API documentation
- Check `ARCHITECTURE.md` for system architecture
- Review `README.md` for detailed features

### 5. Monitor Your Service

**View Metrics**:
```bash
curl http://localhost:9090/metrics
```

**Check Statistics**:
```bash
curl http://localhost:3000/api/notifications/stats
```

## Troubleshooting

### Port Already in Use

If ports are already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port (first number)
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Kafka Connection Issues

```bash
# Check Kafka status
docker-compose ps kafka

# View Kafka logs
docker-compose logs kafka

# Kafka UI: http://localhost:8080
```

### Cannot Generate Prisma Client

```bash
# Clean and regenerate
rm -rf node_modules/.prisma
npm run db:generate
```

### Tests Failing

```bash
# Make sure test database is available
docker-compose up -d postgres

# Run tests
npm test
```

## Production Deployment

For production deployment:

1. **Build Docker Image**:
   ```bash
   docker build -t notification-service:latest .
   ```

2. **Set Production Environment Variables**:
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=postgresql://...
   # Set all required variables
   ```

3. **Run Migrations**:
   ```bash
   npm run migrate
   ```

4. **Start Service**:
   ```bash
   npm start
   ```

For Kubernetes deployment, see `README.md` deployment section.

## Getting Help

- **Documentation**: See `README.md`, `API.md`, `ARCHITECTURE.md`
- **Issues**: Check existing issues or create a new one
- **Logs**: Check service logs with `docker-compose logs -f notification-service`

## Next Steps

1. ✅ Service is running
2. 📖 Read the [API Documentation](API.md)
3. 🏗️ Understand the [Architecture](ARCHITECTURE.md)
4. 🧪 Run the tests: `npm test`
5. 🚀 Deploy to production

Happy coding! 🎉
