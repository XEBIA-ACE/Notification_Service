# Notification Service

A production-ready, microservice-based notification system that supports multiple delivery channels including Email (SendGrid), Push Notifications (Firebase Cloud Messaging), WebSockets, and message queues (Apache Kafka and RabbitMQ).

## Features

- **Multiple Notification Channels**
  - Email notifications via SendGrid
  - Push notifications via Firebase Cloud Messaging (FCM)
  - Real-time notifications via WebSocket
  - SMS support (extensible architecture)

- **Message Queue Integration**
  - Apache Kafka for high-throughput message streaming
  - RabbitMQ for reliable message queuing
  - Dead Letter Queue (DLQ) support for failed messages

- **Production-Ready Architecture**
  - Clean Architecture with clear separation of concerns
  - SOLID principles and dependency injection
  - Comprehensive error handling and retry logic
  - Structured logging with Pino
  - Prometheus metrics for monitoring
  - Health check endpoints for Kubernetes/container orchestration

- **Scalability & Reliability**
  - Horizontal scaling support
  - Configurable retry mechanisms
  - Scheduled notifications
  - Priority-based processing
  - Database-backed persistence with PostgreSQL

## Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Message Queues**: Apache Kafka, RabbitMQ
- **Notification Providers**: SendGrid, Firebase Cloud Messaging
- **WebSocket**: Socket.IO
- **Caching**: Redis (for WebSocket scaling)
- **Monitoring**: Prometheus, Pino logger
- **Testing**: Jest
- **Container**: Docker with docker-compose

## Architecture

### Directory Structure

```
notification-service/
├── src/
│   ├── domain/                 # Domain layer (entities, interfaces)
│   │   ├── entities/
│   │   │   └── Notification.ts
│   │   └── interfaces/
│   │       ├── INotificationProvider.ts
│   │       ├── INotificationRepository.ts
│   │       ├── IMessageQueue.ts
│   │       └── ILogger.ts
│   ├── application/            # Application layer (use cases, DTOs)
│   │   ├── dto/
│   │   │   └── NotificationDTO.ts
│   │   └── services/
│   │       └── NotificationService.ts
│   ├── infrastructure/         # Infrastructure layer (implementations)
│   │   ├── database/
│   │   │   └── NotificationRepository.ts
│   │   ├── messaging/
│   │   │   ├── KafkaConsumer.ts
│   │   │   └── RabbitMQClient.ts
│   │   ├── providers/
│   │   │   ├── SendGridProvider.ts
│   │   │   ├── FCMProvider.ts
│   │   │   └── WebSocketProvider.ts
│   │   └── logging/
│   │       └── Logger.ts
│   ├── api/                    # Presentation layer (controllers, routes)
│   │   ├── controllers/
│   │   │   └── NotificationController.ts
│   │   ├── routes/
│   │   │   ├── notificationRoutes.ts
│   │   │   ├── healthRoutes.ts
│   │   │   └── metricsRoutes.ts
│   │   └── middleware/
│   │       ├── validation.ts
│   │       └── errorHandler.ts
│   ├── config/
│   │   └── config.ts
│   ├── __tests__/
│   │   ├── unit/
│   │   └── integration/
│   ├── app.ts
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

### Clean Architecture Layers

1. **Domain Layer**: Core business logic and entities
2. **Application Layer**: Use cases and application services
3. **Infrastructure Layer**: External integrations and implementations
4. **Presentation Layer**: API controllers and routes

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+
- (Optional) SendGrid API key
- (Optional) Firebase credentials

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd notification-service
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
DATABASE_URL=postgresql://postgres:password@localhost:5432/notifications?schema=public

# Optional - Notification Providers
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@example.com
FCM_PROJECT_ID=your-firebase-project-id
FCM_PRIVATE_KEY=your-firebase-private-key
FCM_CLIENT_EMAIL=your-firebase-client-email

# Message Queues
KAFKA_BROKERS=localhost:9092
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

4. **Start infrastructure with Docker Compose**

```bash
docker-compose up -d postgres kafka zookeeper rabbitmq redis
```

5. **Run database migrations**

```bash
npm run migrate:dev
```

6. **Start the application**

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Quick Start with Docker

Run everything with Docker Compose:

```bash
docker-compose up -d
```

This will start:
- Notification Service (ports 3000, 3001, 9090)
- PostgreSQL (port 5432)
- Kafka + Zookeeper (ports 9092, 9094)
- RabbitMQ with Management UI (ports 5672, 15672)
- Redis (port 6379)
- Kafka UI (port 8080)
- Prometheus (port 9091)

## API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### Create Notification

```http
POST /api/notifications
Content-Type: application/json

{
  "userId": "user-123",
  "channel": "EMAIL",
  "type": "welcome",
  "subject": "Welcome!",
  "content": "Welcome to our service",
  "priority": "NORMAL",
  "metadata": {
    "email": "user@example.com"
  }
}
```

**Response (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-123",
    "channel": "EMAIL",
    "type": "welcome",
    "subject": "Welcome!",
    "content": "Welcome to our service",
    "status": "PENDING",
    "priority": "NORMAL",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Notification

```http
GET /api/notifications/:id
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-123",
    "status": "SENT",
    "sentAt": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

#### Get User Notifications

```http
GET /api/notifications/user/:userId?limit=50&offset=0
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-123",
      ...
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

#### Process Notification

```http
POST /api/notifications/:id/process
```

Manually trigger notification processing.

#### Get Statistics

```http
GET /api/notifications/stats
```

**Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "PENDING": 10,
    "PROCESSING": 2,
    "SENT": 100,
    "DELIVERED": 95,
    "FAILED": 5,
    "CANCELLED": 0
  }
}
```

### Health Check Endpoints

```http
GET /health          # Basic health check
GET /health/ready    # Readiness probe (checks dependencies)
GET /health/live     # Liveness probe
```

### Metrics Endpoint

```http
GET /metrics         # Prometheus metrics
```

## Notification Channels

### Email (SendGrid)

Required metadata:
- `email`: Recipient email address

Example:

```json
{
  "userId": "user-123",
  "channel": "EMAIL",
  "type": "password-reset",
  "subject": "Reset Your Password",
  "content": "Click the link to reset your password...",
  "metadata": {
    "email": "user@example.com"
  }
}
```

### Push (Firebase Cloud Messaging)

Required metadata:
- `fcmToken`: Device FCM token

Example:

```json
{
  "userId": "user-123",
  "channel": "PUSH",
  "type": "new-message",
  "subject": "New Message",
  "content": "You have a new message from John",
  "metadata": {
    "fcmToken": "device-token-here"
  }
}
```

### WebSocket

WebSocket notifications are sent in real-time to connected clients.

**Client Connection**

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// Authenticate and join user room
socket.emit('authenticate', { userId: 'user-123' });

// Listen for notifications
socket.on('notification', (notification) => {
  console.log('Received notification:', notification);
});
```

## Message Queue Integration

### Kafka

The service consumes notifications from Kafka topics and processes them asynchronously.

**Publish to Kafka**

```javascript
// Message format
{
  "notificationId": "uuid"
}
```

The service subscribes to the `notifications` topic by default.

### RabbitMQ

Similar to Kafka, RabbitMQ can be used for message queuing.

**Exchange**: `notifications`
**Queue**: `notification-queue`
**Routing Key**: `notification`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | HTTP server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `KAFKA_BROKERS` | Kafka broker addresses | `localhost:9092` |
| `RABBITMQ_URL` | RabbitMQ connection URL | `amqp://guest:guest@localhost:5672` |
| `SENDGRID_API_KEY` | SendGrid API key | - |
| `FCM_PROJECT_ID` | Firebase project ID | - |
| `MAX_RETRY_ATTEMPTS` | Max retry attempts for failed notifications | `3` |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` |

See `.env.example` for a complete list.

### Retry Configuration

Failed notifications are automatically retried based on configuration:

- `MAX_RETRY_ATTEMPTS`: Maximum number of retry attempts (default: 3)
- `RETRY_DELAY_MS`: Delay between retries in milliseconds (default: 1000)

## Database Schema

The service uses Prisma ORM with the following main tables:

- **notifications**: Store all notifications
- **notification_templates**: Reusable notification templates
- **notification_preferences**: User notification preferences
- **audit_logs**: Audit trail for notification events

### Migrations

```bash
# Create a new migration
npm run migrate:dev

# Apply migrations in production
npm run migrate

# Generate Prisma Client
npm run db:generate

# Open Prisma Studio
npm run db:studio
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- Notification.test.ts

# Run integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

### Test Structure

- `src/__tests__/unit/`: Unit tests for individual components
- `src/__tests__/integration/`: Integration tests for API endpoints
- Coverage threshold: 70% for branches, functions, lines, and statements

## Monitoring & Observability

### Logging

The service uses structured logging with Pino:

- Logs are output in JSON format (production) or pretty-printed (development)
- All significant events are logged with appropriate levels
- Request/response logging for API calls

### Metrics

Prometheus metrics are exposed at `/metrics`:

- `notifications_total`: Counter for total notifications by channel and status
- `notification_processing_duration_seconds`: Histogram for processing time
- Default Node.js metrics (memory, CPU, etc.)

### Health Checks

- `/health`: Basic health check
- `/health/ready`: Readiness probe (checks database connection)
- `/health/live`: Liveness probe

Use these for Kubernetes probes:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
```

## Deployment

### Docker

Build and run with Docker:

```bash
# Build image
docker build -t notification-service:latest .

# Run container
docker run -p 3000:3000 -p 3001:3001 -p 9090:9090 \
  -e DATABASE_URL=postgresql://... \
  notification-service:latest
```

### Kubernetes

Example deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
      - name: notification-service
        image: notification-service:latest
        ports:
        - containerPort: 3000
        - containerPort: 3001
        - containerPort: 9090
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: notification-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
```

## Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Adding a New Notification Provider

1. Create a new provider in `src/infrastructure/providers/`
2. Implement the `INotificationProvider` interface
3. Register the provider in `src/app.ts`

Example:

```typescript
export class SMSProvider implements INotificationProvider {
  async send(notification: Notification): Promise<NotificationResult> {
    // Implementation
  }

  supports(notification: Notification): boolean {
    return notification.channel === NotificationChannel.SMS;
  }

  getName(): string {
    return 'SMS';
  }

  isConfigured(): boolean {
    return true;
  }
}
```

## Troubleshooting

### Database Connection Issues

```bash
# Check database is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Test connection
psql postgresql://postgres:password@localhost:5432/notifications
```

### Kafka Connection Issues

```bash
# Check Kafka is running
docker-compose ps kafka

# View Kafka logs
docker-compose logs kafka

# List topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

### RabbitMQ Management UI

Access RabbitMQ Management UI at http://localhost:15672
- Username: `guest`
- Password: `guest`

### Kafka UI

Access Kafka UI at http://localhost:8080 to view topics, messages, and consumer groups.

## Performance Considerations

- **Database Connection Pooling**: Prisma manages connection pooling automatically
- **Message Queue Batching**: Configure batch sizes for Kafka/RabbitMQ consumers
- **WebSocket Scaling**: Use Redis adapter for Socket.IO when running multiple instances
- **Rate Limiting**: Implement rate limiting on API endpoints for production use
- **Caching**: Consider caching user preferences and templates

## Security

- All sensitive data should be stored in environment variables
- Use Helmet.js for security headers (already configured)
- Implement authentication/authorization middleware for production
- Validate and sanitize all input data
- Use HTTPS in production
- Regularly update dependencies

## License

MIT

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

---

Built with Clean Architecture principles for maintainability and scalability.
