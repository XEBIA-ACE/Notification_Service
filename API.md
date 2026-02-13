# API Documentation

## Overview

The Notification Service provides a RESTful API for managing notifications across multiple channels.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, the API does not implement authentication. In production, you should add authentication middleware using JWT, OAuth2, or API keys.

## Common Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "errors": [ ... ] // Validation errors
}
```

## Endpoints

### Notifications

#### Create Notification

Create a new notification to be sent through a specified channel.

**Endpoint**: `POST /api/notifications`

**Request Body**:

```json
{
  "userId": "string (required)",
  "channel": "EMAIL | PUSH | WEBSOCKET | SMS (required)",
  "type": "string (required)",
  "subject": "string (optional)",
  "content": "string (required)",
  "metadata": "object (optional)",
  "priority": "LOW | NORMAL | HIGH | URGENT (optional, default: NORMAL)",
  "scheduledAt": "ISO 8601 date string (optional)"
}
```

**Example Request**:

```json
{
  "userId": "user-123",
  "channel": "EMAIL",
  "type": "welcome",
  "subject": "Welcome to Our Service",
  "content": "Thank you for signing up!",
  "metadata": {
    "email": "user@example.com"
  },
  "priority": "HIGH"
}
```

**Response**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "channel": "EMAIL",
    "type": "welcome",
    "subject": "Welcome to Our Service",
    "content": "Thank you for signing up!",
    "status": "PENDING",
    "priority": "HIGH",
    "scheduledAt": null,
    "sentAt": null,
    "deliveredAt": null,
    "failedAt": null,
    "errorMessage": null,
    "retryCount": 0,
    "externalId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Notification by ID

Retrieve a specific notification by its ID.

**Endpoint**: `GET /api/notifications/:id`

**Parameters**:
- `id` (path, UUID): Notification ID

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-123",
    "status": "SENT",
    "sentAt": "2024-01-01T00:01:00.000Z",
    ...
  }
}
```

**Error Response**: `404 Not Found`

```json
{
  "success": false,
  "error": "Notification not found"
}
```

#### Get User Notifications

Retrieve all notifications for a specific user.

**Endpoint**: `GET /api/notifications/user/:userId`

**Parameters**:
- `userId` (path, string): User ID
- `limit` (query, integer, optional): Number of notifications to return (default: 50, max: 100)
- `offset` (query, integer, optional): Offset for pagination (default: 0)

**Example Request**:

```
GET /api/notifications/user/user-123?limit=10&offset=0
```

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-123",
      "channel": "EMAIL",
      "status": "SENT",
      ...
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "userId": "user-123",
      "channel": "PUSH",
      "status": "DELIVERED",
      ...
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 2
  }
}
```

#### Process Notification

Manually trigger processing of a pending notification.

**Endpoint**: `POST /api/notifications/:id/process`

**Parameters**:
- `id` (path, UUID): Notification ID

**Response**: `200 OK`

```json
{
  "success": true,
  "message": "Notification processing initiated"
}
```

#### Get Statistics

Retrieve notification statistics grouped by status.

**Endpoint**: `GET /api/notifications/stats`

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "PENDING": 10,
    "PROCESSING": 2,
    "SENT": 150,
    "DELIVERED": 145,
    "FAILED": 5,
    "CANCELLED": 0
  }
}
```

### Health & Monitoring

#### Basic Health Check

**Endpoint**: `GET /health`

**Response**: `200 OK`

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "notification-service"
}
```

#### Readiness Probe

Check if the service is ready to accept traffic (checks database connection).

**Endpoint**: `GET /health/ready`

**Response**: `200 OK`

```json
{
  "status": "ready",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": "healthy"
  }
}
```

**Error Response**: `503 Service Unavailable`

```json
{
  "status": "not ready",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": "unhealthy"
  }
}
```

#### Liveness Probe

Check if the service is alive.

**Endpoint**: `GET /health/live`

**Response**: `200 OK`

```json
{
  "status": "alive",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Prometheus Metrics

**Endpoint**: `GET /metrics`

**Response**: `200 OK` (Prometheus text format)

```
# HELP notifications_total Total number of notifications
# TYPE notifications_total counter
notifications_total{channel="EMAIL",status="SENT"} 150
notifications_total{channel="PUSH",status="SENT"} 75

# HELP notification_processing_duration_seconds Duration of notification processing
# TYPE notification_processing_duration_seconds histogram
...
```

## Notification Channels

### EMAIL

**Required Metadata**:
- `email`: Recipient email address

**Example**:

```json
{
  "userId": "user-123",
  "channel": "EMAIL",
  "type": "order-confirmation",
  "subject": "Order Confirmed",
  "content": "Your order #12345 has been confirmed.",
  "metadata": {
    "email": "customer@example.com",
    "orderId": "12345"
  }
}
```

### PUSH

**Required Metadata**:
- `fcmToken`: Firebase Cloud Messaging device token

**Example**:

```json
{
  "userId": "user-123",
  "channel": "PUSH",
  "type": "chat-message",
  "subject": "New Message",
  "content": "You have a new message from Alice",
  "metadata": {
    "fcmToken": "dXJhbmRvbS1kZXZpY2UtdG9rZW4=",
    "senderId": "alice-456"
  }
}
```

### WEBSOCKET

**No additional metadata required** - notifications are sent to connected clients in real-time.

**Example**:

```json
{
  "userId": "user-123",
  "channel": "WEBSOCKET",
  "type": "system-alert",
  "subject": "System Maintenance",
  "content": "System maintenance scheduled at 2AM",
  "priority": "URGENT"
}
```

### SMS

**Required Metadata**:
- `phoneNumber`: Recipient phone number in E.164 format

**Example**:

```json
{
  "userId": "user-123",
  "channel": "SMS",
  "type": "verification",
  "content": "Your verification code is 123456",
  "metadata": {
    "phoneNumber": "+1234567890"
  }
}
```

## Notification Types

The `type` field is application-specific and can be any string. Common examples:

- `welcome`: Welcome message for new users
- `password-reset`: Password reset instructions
- `order-confirmation`: Order confirmation
- `payment-received`: Payment notification
- `system-alert`: System-wide alerts
- `chat-message`: Chat notifications
- `reminder`: General reminders

## Notification Status Flow

```
PENDING → PROCESSING → SENT → DELIVERED
   ↓
FAILED (can retry)
   ↓
PENDING (retry)
```

**Status Descriptions**:

- `PENDING`: Notification created, waiting to be processed
- `PROCESSING`: Currently being sent
- `SENT`: Successfully sent to provider
- `DELIVERED`: Confirmed delivery (when supported by provider)
- `FAILED`: Failed to send (eligible for retry)
- `CANCELLED`: Cancelled by user or system

## Priority Levels

- `LOW`: Non-urgent notifications, can be batched
- `NORMAL`: Standard priority (default)
- `HIGH`: Important notifications, processed quickly
- `URGENT`: Critical notifications, highest priority

Higher priority notifications are processed first when multiple notifications are pending.

## Scheduled Notifications

Notifications can be scheduled for future delivery by setting the `scheduledAt` field:

```json
{
  "userId": "user-123",
  "channel": "EMAIL",
  "type": "reminder",
  "content": "Your appointment is tomorrow at 2PM",
  "scheduledAt": "2024-01-02T14:00:00.000Z"
}
```

Scheduled notifications remain in `PENDING` status until the scheduled time.

## Error Handling

### Validation Errors

**Status**: `400 Bad Request`

```json
{
  "success": false,
  "errors": [
    {
      "msg": "User ID is required",
      "param": "userId",
      "location": "body"
    },
    {
      "msg": "Invalid channel",
      "param": "channel",
      "location": "body"
    }
  ]
}
```

### Server Errors

**Status**: `500 Internal Server Error`

```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting

In production, implement rate limiting to prevent abuse:

- Recommended: 100 requests per minute per IP
- Use Redis for distributed rate limiting
- Return `429 Too Many Requests` when limit exceeded

## Pagination

List endpoints support pagination using `limit` and `offset`:

```
GET /api/notifications/user/user-123?limit=20&offset=40
```

- `limit`: Number of items per page (max: 100)
- `offset`: Number of items to skip

Calculate pages:
- Page 1: `offset=0, limit=20`
- Page 2: `offset=20, limit=20`
- Page 3: `offset=40, limit=20`

## WebSocket API

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');
```

### Authentication

```javascript
socket.emit('authenticate', { userId: 'user-123' });
```

### Receiving Notifications

```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // notification format matches REST API response
});
```

### Events

- `authenticate`: Join user notification room
- `notification`: Receive real-time notifications
- `disconnect`: Handle disconnection

## Best Practices

1. **Include Metadata**: Always include necessary metadata for the notification channel
2. **Use Appropriate Priority**: Reserve HIGH/URGENT for truly important notifications
3. **Handle Errors**: Implement proper error handling on the client side
4. **Idempotency**: Store notification IDs to prevent duplicate processing
5. **Monitoring**: Monitor the `/metrics` endpoint for system health
6. **Retry Logic**: Failed notifications are automatically retried up to 3 times
7. **Scheduled Notifications**: Use for time-sensitive communications

## Examples

### Send Welcome Email

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "channel": "EMAIL",
    "type": "welcome",
    "subject": "Welcome!",
    "content": "Thanks for joining us!",
    "metadata": {
      "email": "user@example.com"
    }
  }'
```

### Send Push Notification

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
      "fcmToken": "device-token"
    },
    "priority": "HIGH"
  }'
```

### Get User Notifications

```bash
curl http://localhost:3000/api/notifications/user/user-123?limit=10
```

### Check Health

```bash
curl http://localhost:3000/health
```
