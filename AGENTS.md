# AGENTS.md

## Stack

- **Service:** Notification Service
- **Type:** integration
- **Technologies:**
- Node.js / NestJS (TypeScript) or Python
- Apache Kafka consumer (consumer group, DLQ handling)
- Twilio SMS API / AWS SNS (SMS delivery)
- SendGrid API / AWS SES (email delivery)
- Handlebars / Jinja2 (notification templates)
- Resilience4j / opossum (circuit breaker, retry with exponential backoff)
- HashiCorp Vault / AWS Secrets Manager (API key management)
- OpenTelemetry (distributed tracing, correlation ID propagation)
- Docker / Kubernetes (HPA, consumer group scaling)
- **Responsibilities:**
- Consume UserRegistered, OTPRequested, and AccountVerified domain events from Kafka consumer group
- Dispatch OTP codes via SMS gateway (Twilio / AWS SNS) for mobile registration flows
- Send email verification link emails via email provider (SendGrid / AWS SES) for email registration flows
- Send welcome emails upon AccountVerified event
- Manage notification templates with localization support (Handlebars / Jinja2)
- Implement idempotent event processing to handle Kafka at-least-once delivery safely
- Apply circuit breakers (Resilience4j) around SMS gateway and email provider calls
- Handle delivery retries with exponential backoff and route unrecoverable failures to Dead Letter Queue
- Track and log notification delivery status (delivered, failed, bounced) — masking OTP values and PII in logs
- Retrieve API keys for external providers from secrets manager (Vault / AWS Secrets Manager)

## General Rules

- Always read files in /specs before implementing
- Never implement without acceptance criteria
- Code should be simple and readable
- Avoid overengineering
- The project follows a hexagonal architecture

## Required Workflow

1. Read the specs in the /specs directory
2. Generate tasks.md if it does not exist
3. Implement based on the tasks
4. Create automated tests
5. Validate acceptance criteria

## Testing

- Cover all acceptance criteria
- Tests should be clear and straightforward
- Generated code must reach **90% unit test coverage**

## Constraints

- Do not invent requirements that are not described
- Do not change behavior without updating the spec
