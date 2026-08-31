# AGENTS.md

## Stack

- **Service:** Notification Service
- **Type:** integration
- **Technologies:**
- Python with Celery (async task processing) or Node.js with BullMQ
- Apache Kafka / RabbitMQ consumer (AMQP / Kafka Consumer Group)
- SendGrid REST API / AWS SES SDK (email delivery)
- Twilio REST API / AWS SNS SDK (SMS delivery)
- Handlebars / Jinja2 (notification templates)
- Docker + Kubernetes (horizontal scaling based on queue depth / HPA)
- OpenTelemetry SDK for tracing and metrics
- AWS Secrets Manager / HashiCorp Vault for provider API key retrieval
- **Responsibilities:**
- Consume UserRegistered, OTPRequested, and UserVerified events from the Event Bus (Kafka/RabbitMQ) with idempotency key handling for at-least-once delivery safety
- Dispatch email verification links and welcome emails to newly registered users via the email provider (SendGrid / AWS SES)
- Send SMS OTP codes to mobile numbers in E.164 format via the SMS gateway (Twilio / AWS SNS)
- Manage notification templates (Handlebars / Jinja2) and support localization/i18n
- Track delivery status via provider webhooks (delivered, bounced, failed) and trigger retries for transient failures
- Respect user communication preferences and opt-out/suppression lists
- Ensure OTP values are never logged in plaintext after dispatch
- Handle Dead Letter Queue (DLQ) events with alerting for undeliverable notifications
- Retrieve provider API keys from Secrets Manager at runtime

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
