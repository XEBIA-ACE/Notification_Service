# Contributing to Notification Service

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the Notification Service.

## Code of Conduct

Be respectful, professional, and inclusive. We welcome contributions from everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/notification-service.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+
- Git

### Local Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start infrastructure
docker-compose up -d postgres kafka zookeeper rabbitmq redis

# Run migrations
npm run migrate:dev

# Start development server
npm run dev
```

## Code Standards

### TypeScript

- Use TypeScript strict mode
- Define proper types for all functions and variables
- Avoid `any` type unless absolutely necessary
- Use interfaces for contracts, types for data structures

### Code Style

- Follow the existing code style
- Run `npm run lint` before committing
- Run `npm run format` to format code
- Use meaningful variable and function names
- Write self-documenting code

### Naming Conventions

- **Classes**: PascalCase (e.g., `NotificationService`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `INotificationProvider`)
- **Functions/Methods**: camelCase (e.g., `processNotification`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Files**: PascalCase for classes (e.g., `NotificationService.ts`)

### Clean Architecture

Follow Clean Architecture principles:

1. **Domain Layer**: No external dependencies
2. **Application Layer**: Depends only on domain
3. **Infrastructure Layer**: Implements domain interfaces
4. **Presentation Layer**: Depends on application layer

Dependencies should point inward, never outward.

## Testing

### Writing Tests

- Write tests for all new features
- Maintain test coverage above 70%
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### Test Types

**Unit Tests** (`src/__tests__/unit/`):
```typescript
describe('NotificationService', () => {
  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      // Arrange
      const dto = { ... };

      // Act
      const result = await service.createNotification(dto);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

**Integration Tests** (`src/__tests__/integration/`):
```typescript
describe('Notification API', () => {
  it('POST /api/notifications should create notification', async () => {
    const response = await request(app)
      .post('/api/notifications')
      .send({ ... });

    expect(response.status).toBe(201);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- NotificationService.test.ts

# Watch mode
npm run test:watch
```

## Adding New Features

### Adding a Notification Provider

1. Create provider class in `src/infrastructure/providers/`
2. Implement `INotificationProvider` interface
3. Add configuration to `src/config/config.ts`
4. Register in `src/app.ts`
5. Write unit tests
6. Update documentation

Example:

```typescript
// src/infrastructure/providers/SMSProvider.ts
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

### Adding a New Endpoint

1. Add route handler in controller
2. Add validation rules
3. Register route in routes file
4. Write integration tests
5. Update API documentation

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Branch is up to date with main

### PR Description

Include:
- **What**: Description of changes
- **Why**: Reason for changes
- **How**: Implementation approach
- **Testing**: How to test the changes
- **Screenshots**: If UI changes

### PR Title Format

```
[Type] Brief description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Code style (formatting)
- refactor: Code refactoring
- test: Tests
- chore: Maintenance
```

Examples:
- `[feat] Add SMS notification provider`
- `[fix] Fix retry logic for failed notifications`
- `[docs] Update API documentation`

### Review Process

1. Submit pull request
2. Automated checks run (tests, linting)
3. Code review by maintainers
4. Address feedback
5. Approval and merge

## Commit Messages

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:
```
feat(providers): add SMS notification provider

- Implemented SMSProvider class
- Added Twilio integration
- Added configuration options
- Added unit tests

Closes #123
```

## Documentation

### Code Comments

- Use JSDoc for public APIs
- Comment complex logic
- Don't comment obvious code
- Keep comments up to date

```typescript
/**
 * Process a notification and send it through the appropriate provider
 * @param notificationId - The ID of the notification to process
 * @throws {Error} If notification not found
 */
async processNotification(notificationId: string): Promise<void> {
  // Implementation
}
```

### README Updates

Update README.md for:
- New features
- Configuration changes
- API changes
- Setup instructions

### API Documentation

Update API.md for:
- New endpoints
- Changed request/response formats
- New error codes

## Issue Reporting

### Bug Reports

Include:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version)
- Logs/screenshots

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered
- Additional context

## Performance Considerations

- Avoid N+1 queries
- Use database indexes
- Implement caching where appropriate
- Use async/await properly
- Don't block the event loop
- Profile before optimizing

## Security

- Never commit secrets or credentials
- Use environment variables
- Validate all input
- Sanitize output
- Follow OWASP guidelines
- Report security issues privately

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag
4. Push tag
5. GitHub Actions builds and publishes

## Getting Help

- Check existing issues
- Read documentation
- Ask in discussions
- Contact maintainers

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

Thank you for contributing!
