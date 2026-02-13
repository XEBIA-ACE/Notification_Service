# Architecture Documentation

## Overview

The Notification Service is built using **Clean Architecture** principles, ensuring separation of concerns, testability, and maintainability. The architecture is designed to be scalable, supporting multiple notification channels and message queue systems.

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

The innermost layer containing core business logic and entities. This layer has no dependencies on external frameworks or libraries.

**Components**:
- **Entities** (`entities/`): Core business objects
  - `Notification`: Central entity representing a notification with its lifecycle methods

- **Interfaces** (`interfaces/`): Contracts that outer layers must implement
  - `INotificationProvider`: Contract for notification delivery providers
  - `INotificationRepository`: Contract for data persistence
  - `IMessageQueue`: Contract for message queue implementations
  - `ILogger`: Contract for logging implementations

**Key Principles**:
- Independent of frameworks
- Testable without external dependencies
- Contains business rules and domain logic
- No dependencies on outer layers

### 2. Application Layer (`src/application/`)

Contains application-specific business rules and use cases. Orchestrates the flow of data between domain and infrastructure layers.

**Components**:
- **Services** (`services/`): Application services implementing use cases
  - `NotificationService`: Orchestrates notification creation, processing, and retrieval

- **DTOs** (`dto/`): Data Transfer Objects for API communication
  - `NotificationDTO`: Request/response structures

**Responsibilities**:
- Orchestrate domain entities
- Implement use cases
- Transform data between layers
- Coordinate transactions

### 3. Infrastructure Layer (`src/infrastructure/`)

Implements interfaces defined in the domain layer using external frameworks and services.

**Components**:

- **Database** (`database/`):
  - `NotificationRepository`: Prisma-based implementation of `INotificationRepository`

- **Messaging** (`messaging/`):
  - `KafkaConsumer`: Apache Kafka consumer implementation
  - `KafkaProducer`: Apache Kafka producer implementation
  - `RabbitMQClient`: RabbitMQ client implementation

- **Providers** (`providers/`):
  - `SendGridProvider`: Email notifications via SendGrid
  - `FCMProvider`: Push notifications via Firebase Cloud Messaging
  - `WebSocketProvider`: Real-time notifications via Socket.IO

- **Logging** (`logging/`):
  - `Logger`: Pino-based logger implementation

**Responsibilities**:
- Implement external integrations
- Handle technical details
- Provide concrete implementations of interfaces
- Manage external service connections

### 4. Presentation Layer (`src/api/`)

Handles HTTP requests and responses. Entry point for external clients.

**Components**:

- **Controllers** (`controllers/`):
  - `NotificationController`: Handles notification-related HTTP requests

- **Routes** (`routes/`):
  - `notificationRoutes`: Notification endpoints
  - `healthRoutes`: Health check endpoints
  - `metricsRoutes`: Prometheus metrics endpoints

- **Middleware** (`middleware/`):
  - `validation`: Request validation middleware
  - `errorHandler`: Global error handling

**Responsibilities**:
- Handle HTTP requests/responses
- Validate input
- Transform DTOs
- Route requests to appropriate controllers

## Data Flow

### Creating a Notification

```
1. Client → POST /api/notifications
2. NotificationController.createNotification()
3. NotificationService.createNotification()
4. NotificationRepository.save()
5. Database (PostgreSQL)
6. Response → Client
```

### Processing a Notification

```
1. Kafka/RabbitMQ → Message received
2. Consumer Handler
3. NotificationService.processNotification()
4. NotificationRepository.findById()
5. NotificationProvider.send() (SendGrid/FCM/WebSocket)
6. NotificationRepository.update()
7. Update status in Database
```

## Dependency Flow

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│          (API Controllers)              │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│          Application Layer              │
│       (Services & Use Cases)            │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│            Domain Layer                 │
│    (Entities & Interfaces)              │
└──────────────┬──────────────────────────┘
               ↑
               │
┌──────────────┴──────────────────────────┐
│        Infrastructure Layer             │
│  (Repositories, Providers, Messaging)   │
└─────────────────────────────────────────┘
```

**Dependency Rule**: Dependencies only point inward. Inner layers know nothing about outer layers.

## Design Patterns

### 1. Dependency Injection

All dependencies are injected through constructors, enabling:
- Easy testing with mocks
- Loose coupling
- Flexibility to swap implementations

```typescript
constructor(
  private readonly repository: INotificationRepository,
  private readonly providers: INotificationProvider[],
  private readonly logger: ILogger
)
```

### 2. Repository Pattern

Abstracts data access logic behind the `INotificationRepository` interface:
- Separates business logic from data access
- Enables testing without a database
- Allows switching databases without affecting business logic

### 3. Strategy Pattern

Multiple notification providers implement `INotificationProvider`:
- Select appropriate provider based on notification channel
- Easy to add new providers
- Providers are independent of each other

### 4. Factory Pattern

Service initialization in `app.ts` acts as a factory:
- Centralized dependency creation
- Manages complex object creation
- Ensures proper configuration

## Message Queue Architecture

### Kafka Integration

```
┌──────────┐      ┌──────────┐      ┌────────────────┐
│ Producer │─────→│  Kafka   │─────→│ Consumer Group │
│          │      │  Broker  │      │   (Service)    │
└──────────┘      └──────────┘      └────────────────┘
                        │
                        ↓
                  ┌──────────┐
                  │   DLQ    │
                  │  Topic   │
                  └──────────┘
```

**Features**:
- High throughput message processing
- Consumer group for load distribution
- Dead Letter Queue (DLQ) for failed messages
- Automatic retry mechanism

### RabbitMQ Integration

```
┌──────────┐      ┌───────────┐      ┌───────┐      ┌──────────┐
│ Producer │─────→│ Exchange  │─────→│ Queue │─────→│ Consumer │
│          │      │ (topic)   │      │       │      │          │
└──────────┘      └───────────┘      └───────┘      └──────────┘
```

**Features**:
- Reliable message delivery
- Topic-based routing
- Message acknowledgment
- Automatic requeue on failure

## Notification Flow

### Lifecycle States

```
PENDING ──→ PROCESSING ──→ SENT ──→ DELIVERED
   │
   └──→ FAILED ──→ (Retry) ──→ PENDING
```

### Processing Logic

1. **Validation**: Check if notification should be processed
2. **Provider Selection**: Choose appropriate provider based on channel
3. **Sending**: Attempt to send via provider
4. **Status Update**: Update notification status based on result
5. **Retry Logic**: Schedule retry if failed and under retry limit

### Retry Strategy

- **Max Retries**: 3 attempts (configurable)
- **Delay**: Exponential backoff (configurable)
- **Conditions**: Only retry if status is FAILED and retries < max
- **DLQ**: Failed messages after max retries go to Dead Letter Queue

## Scalability Considerations

### Horizontal Scaling

The service is designed to scale horizontally:

1. **Stateless**: No session state stored in service
2. **Database Connection Pooling**: Prisma manages connection pools
3. **Message Queue Distribution**: Kafka consumer groups distribute load
4. **WebSocket Scaling**: Use Redis adapter for Socket.IO in multi-instance setup

### Load Distribution

```
┌─────────┐
│  Load   │
│ Balancer│
└────┬────┘
     │
     ├──→ Instance 1 ──→ Database
     │                   (Connection Pool)
     ├──→ Instance 2 ──→
     │
     └──→ Instance 3 ──→
```

### Performance Optimization

1. **Database Indexes**: Optimized queries with proper indexes
2. **Connection Pooling**: Reuse database connections
3. **Async Processing**: Non-blocking I/O operations
4. **Batch Processing**: Process multiple notifications in parallel
5. **Caching**: Cache user preferences and templates (Redis)

## Monitoring & Observability

### Metrics (Prometheus)

- `notifications_total`: Counter by channel and status
- `notification_processing_duration_seconds`: Histogram of processing time
- Default Node.js metrics (memory, CPU, event loop)

### Logging (Pino)

Structured logging with levels:
- **info**: Normal operations
- **warn**: Unusual but handled situations
- **error**: Errors with stack traces
- **debug**: Detailed debugging information

### Health Checks

1. **Liveness**: `/health/live` - Is the service alive?
2. **Readiness**: `/health/ready` - Is the service ready to accept traffic?
3. **Basic**: `/health` - Simple health indicator

## Security Considerations

### Current Implementation

- Helmet.js for security headers
- Input validation with express-validator
- SQL injection prevention via Prisma
- Environment variables for sensitive data

### Production Recommendations

1. **Authentication**: Implement JWT or OAuth2
2. **Authorization**: Role-based access control
3. **Rate Limiting**: Prevent abuse
4. **API Keys**: For service-to-service communication
5. **Encryption**: TLS/SSL for all communications
6. **Secrets Management**: Use vault for sensitive data

## Testing Strategy

### Unit Tests

- Test domain entities in isolation
- Mock dependencies using interfaces
- Focus on business logic
- Target: 70%+ coverage

### Integration Tests

- Test API endpoints with real database (test instance)
- Test message queue integration
- Test provider integrations with mocks
- Verify end-to-end flows

### Testing Pyramid

```
        /\
       /  \      Unit Tests (70%)
      /────\
     /      \    Integration Tests (20%)
    /────────\
   /          \  E2E Tests (10%)
  /____________\
```

## Configuration Management

### Environment-Based Configuration

```typescript
config = {
  development: { ... },
  staging: { ... },
  production: { ... }
}
```

### Configuration Validation

- Required variables checked at startup
- Type validation for all config values
- Fail-fast approach for missing config

## Error Handling

### Error Propagation

1. **Domain Layer**: Throws domain-specific errors
2. **Application Layer**: Catches and transforms to application errors
3. **Presentation Layer**: Catches and returns HTTP responses
4. **Global Handler**: Catches unhandled errors

### Error Categories

- **Validation Errors**: 400 Bad Request
- **Not Found Errors**: 404 Not Found
- **Business Logic Errors**: 422 Unprocessable Entity
- **Server Errors**: 500 Internal Server Error

## Future Enhancements

### Planned Features

1. **Template System**: Reusable notification templates
2. **User Preferences**: Respect user notification preferences
3. **Analytics**: Track notification metrics and engagement
4. **A/B Testing**: Test different notification strategies
5. **Throttling**: Prevent notification spam
6. **Batching**: Batch similar notifications
7. **Localization**: Multi-language support
8. **Scheduled Campaigns**: Bulk scheduled notifications

### Technical Improvements

1. **GraphQL API**: Alternative to REST
2. **Event Sourcing**: Store notification events
3. **CQRS**: Separate read/write models
4. **Service Mesh**: Istio/Linkerd integration
5. **Distributed Tracing**: OpenTelemetry integration

## Deployment Architecture

### Kubernetes Deployment

```yaml
┌───────────────────────────────────────┐
│          Ingress Controller           │
└────────────────┬──────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────┐              ┌─────▼───┐
│  HTTP  │              │   WS    │
│ Service│              │ Service │
└───┬────┘              └─────┬───┘
    │                         │
    └────────────┬────────────┘
                 │
         ┌───────▼────────┐
         │ Notification   │
         │   Service      │
         │   (3 pods)     │
         └───────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│ Postgres│ │ Kafka  │  │ Redis  │
└─────────┘ └────────┘  └────────┘
```

### Resource Requirements

**Per Instance**:
- CPU: 500m - 1000m
- Memory: 512Mi - 1Gi
- Storage: 10Gi (for logs)

**Scaling**:
- Min replicas: 2
- Max replicas: 10
- CPU target: 70%
- Memory target: 80%

## Conclusion

This architecture provides:
- **Maintainability**: Clear separation of concerns
- **Testability**: Easy to test with mocks
- **Scalability**: Horizontal scaling ready
- **Extensibility**: Easy to add new providers/channels
- **Reliability**: Retry logic and error handling
- **Observability**: Comprehensive logging and metrics
