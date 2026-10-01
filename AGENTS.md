# AGENTS.md — Notification Worker

## 1. Stack

| Technology | Role |
|---|---|
| **Node.js 20 LTS** | Runtime for the background consumer process |
| **TypeScript 5.x** | Strict typing across all source files |
| **KafkaJS** | Kafka consumer client — event consumption and DLQ routing |
| **@aws-sdk/client-sqs** | SQS subscriber alternative and DLQ integration |
| **@aws-sdk/client-ses** | AWS SES email delivery client |
| **@sendgrid/mail** | SendGrid HTTPS API email delivery client |
| **twilio** | Twilio HTTPS API SMS delivery client |
| **@aws-sdk/client-sns** | AWS SNS SMS delivery client |
| **@aws-sdk/client-secrets-manager** | API key retrieval for external providers at startup |
| **zod** | Runtime schema validation for incoming event payloads |
| **p-retry** | Exponential backoff retry logic for transient delivery failures |
| **pino** | Structured JSON logging (no PII fields) |
| **Jest 29** | Unit testing with mocked provider clients |
| **ts-jest** | TypeScript transformer for Jest |
| **@aws-sdk/client-cloudwatch** | Emit DLQ depth metrics and anomaly alerts |
| **Docker / AWS ECS** | Containerised deployment |
| **GitHub Actions** | CI pipeline |

---

## 2. Project Structure

```
notification-worker/
├── src/
│   ├── consumers/
│   │   ├── kafkaConsumer.ts          # KafkaJS consumer setup, partition assignment, idempotency guard
│   │   └── sqsConsumer.ts            # SQS long-poll loop, visibility timeout management
│   ├── handlers/
│   │   └── userRegisteredHandler.ts  # Orchestrates email + SMS dispatch for UserRegistered events
│   ├── providers/
│   │   ├── email/
│   │   │   ├── emailProvider.ts      # IEmailProvider interface
│   │   │   ├── sesProvider.ts        # AWS SES implementation
│   │   │   └── sendgridProvider.ts   # SendGrid implementation
│   │   └── sms/
│   │       ├── smsProvider.ts        # ISmsProvider interface
│   │       ├── twilioProvider.ts     # Twilio implementation
│   │       └── snsProvider.ts        # AWS SNS implementation
│   ├── dlq/
│   │   ├── dlqRouter.ts              # Routes exhausted messages to Kafka DLQ / SQS DLQ
│   │   └── dlqMonitor.ts            # Polls DLQ depth, emits CloudWatch metrics and alerts
│   ├── retry/
│   │   └── withRetry.ts              # p-retry wrapper with exponential backoff config
│   ├── secrets/
│   │   └── secretsLoader.ts          # Fetches and caches provider credentials from Secrets Manager
│   ├── schemas/
│   │   └── userRegisteredEvent.ts    # Zod schema for UserRegistered domain event
│   ├── config/
│   │   └── config.ts                 # Typed env-var config (no defaults for secrets)
│   ├── observability/
│   │   ├── logger.ts                 # Pino logger instance, PII redaction serialisers
│   │   └── metrics.ts               # CloudWatch metric publisher helpers
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript interfaces and type aliases
│   └── index.ts                      # Process entry point — wires consumers, starts polling
├── tests/
│   ├── unit/
│   │   ├── handlers/
│   │   │   └── userRegisteredHandler.test.ts
│   │   ├── providers/
│   │   │   ├── email/
│   │   │   │   ├── sesProvider.test.ts
│   │   │   │   └── sendgridProvider.test.ts
│   │   │   └── sms/
│   │   │       ├── twilioProvider.test.ts
│   │   │       └── snsProvider.test.ts
│   │   ├── dlq/
│   │   │   ├── dlqRouter.test.ts
│   │   │   └── dlqMonitor.test.ts
│   │   ├── retry/
│   │   │   └── withRetry.test.ts
│   │   └── schemas/
│   │       └── userRegisteredEvent.test.ts
│   └── helpers/
│       ├── mockEmailProvider.ts      # Jest mock implementing IEmailProvider
│       ├── mockSmsProvider.ts        # Jest mock implementing ISmsProvider
│       └── eventFixtures.ts          # Canonical UserRegistered event test fixtures
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI pipeline
├── Dockerfile
├── docker-compose.yml
├── jest.config.ts
├── tsconfig.json
├── tsconfig.build.json
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tasks.md                          # Agent-generated task list (created before implementation)
└── package.json
```

---

## 3. Required Workflow

The agent **must** follow these steps in order. Do not skip or reorder steps.

### Step 1 — Read Specifications
- Read this `AGENTS.md` in full before writing any code.
- Identify all provider interfaces, event schemas, retry policies, and DLQ behaviours described.

### Step 2 — Create `tasks.md`
- Before touching any source file, create `tasks.md` at the project root.
- Break the implementation into atomic, checkable tasks. Example structure:
  ```
  ## Tasks
  - [ ] Initialise package.json and install dependencies
  - [ ] Configure tsconfig.json and tsconfig.build.json
  - [ ] Implement config.ts with typed env validation
  - [ ] Implement secretsLoader.ts
  - [ ] Define userRegisteredEvent Zod schema
  - [ ] Implement IEmailProvider interface and SES + SendGrid providers
  - [ ] Implement ISmsProvider interface and Twilio + SNS providers
  - [ ] Implement withRetry.ts exponential backoff wrapper
  - [ ] Implement dlqRouter.ts
  - [ ] Implement dlqMonitor.ts with CloudWatch metrics
  - [ ] Implement userRegisteredHandler.ts
  - [ ] Implement kafkaConsumer.ts with idempotency guard
  - [ ] Implement sqsConsumer.ts
  - [ ] Implement logger.ts with PII redaction
  - [ ] Write all unit tests to ≥90% coverage
  - [ ] Validate tests pass and coverage threshold is met
  - [ ] Write Dockerfile and docker-compose.yml
  - [ ] Write ci.yml GitHub Actions pipeline
  ```
- Check off each task (`[x]`) as it is completed.

### Step 3 — Implement Source Files
- Implement files in dependency order: `config` → `secrets` → `schemas` → `providers` → `retry` → `dlq` → `handlers` → `consumers` → `index`.
- Every file must compile cleanly with `tsc --noEmit` before moving on.
- Never log, store, or propagate PII fields (email address, phone number, full name). Pass them transiently only to the provider call; redact them in all log serialisers.

### Step 4 — Write Tests
- Write unit tests immediately after each module is implemented, not at the end.
- Mock all external AWS SDK clients and third-party HTTP clients using Jest manual mocks or `jest.mock()`.
- Run `npm test` after every test file is written to catch regressions immediately.

### Step 5 — Validate
- Run `npm run lint` — zero errors permitted.
- Run `npm run typecheck` — zero errors permitted.
- Run `npm test -- --coverage` — overall line/branch/function coverage must be **≥ 90%**.
- Run `docker build -t notification-worker:local .` — image must build successfully.
- Mark all tasks in `tasks.md` as `[x]` only after all validations pass.

---

## 4. Coding Conventions

### Naming
- **Files:** `camelCase.ts` for source, `camelCase.test.ts` for tests.
- **Classes/Interfaces:** `PascalCase`. Prefix interfaces with `I` (e.g., `IEmailProvider`, `ISmsProvider`).
- **Functions/Variables:** `camelCase`.
- **Constants:** `SCREAMING_SNAKE_CASE` for module-level constants.
- **Env vars:** `SCREAMING_SNAKE_CASE` (e.g., `KAFKA_BROKER_URL`, `EMAIL_PROVIDER`).

### TypeScript
- Enable `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true` in `tsconfig.json`.
- No `any` types. Use `unknown` and narrow with Zod or type guards.
- All async functions must return explicit `Promise<T>` types.
- Use `readonly` on all interface fields that are not mutated.

### Architecture Patterns
- **Provider pattern:** `IEmailProvider` and `ISmsProvider` interfaces with concrete implementations selected at startup via `EMAIL_PROVIDER` / `SMS_PROVIDER` env vars. The handler depends only on the interface.
- **Idempotency:** The Kafka consumer must track processed `eventId` values using an in-memory `Set` (or Redis if `IDEMPOTENCY_STORE=redis` is set) to prevent duplicate dispatch on rebalance.
- **No PII persistence:** Event payload fields containing PII (`email`, `phoneNumber`, `name`) must be destructured inline within the handler and passed directly to provider calls. They must never be assigned to a variable that outlives the function scope, logged, or included in DLQ messages — only the `eventId`, `userId`, and `failureReason` go to the DLQ.
- **Retry policy:** Use `p-retry` with `retries: 3`, `factor: 2`, `minTimeout: 500ms`, `maxTimeout: 8000ms`. Classify errors as retryable (network, 429, 5xx) or non-retryable (4xx validation) before applying retry.
- **DLQ routing:** After retry exhaustion, publish a sanitised (non-PII) failure record to the configured DLQ. Include `eventId`, `userId`, `eventType`, `failureReason`, `attemptCount`, `timestamp`.
- **Secrets:** Load all provider credentials from AWS Secrets Manager once at process startup via `secretsLoader.ts`. Cache in memory for the process lifetime. Never read secrets from env vars directly in provider files.
- **Structured logging:** Use `pino` with a custom `redact` array: `['email', 'phoneNumber', 'name', 'address', '*.email', '*.phoneNumber']`. Log at `info` for successful dispatch, `warn` for retryable failures, `error` for DLQ routing.

### Style
- 2-space indentation, single quotes, trailing commas (`es5`), semicolons required.
- ESLint with `@typescript-eslint/recommended` + `@typescript-eslint/strict`.
- Prettier for formatting; ESLint and Prettier must agree (use `eslint-config-prettier`).

---

## 5. Testing

### Framework & Setup
- **Jest 29** with `ts-jest` transformer.
- `jest.config.ts` must set:
  ```ts
  export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/unit'],
    collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
    coverageThresholds: {
      global: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  };
  ```

### Mocking Rules
- **AWS SDK clients** (`SESClient`, `SQSClient`, `SNSClient`, `SecretsManagerClient`, `CloudWatchClient`): mock using `jest.mock('@aws-sdk/client-ses')` etc. at the top of each test file. Use `mockResolvedValue` / `mockRejectedValue` on `.send()`.
- **SendGrid:** mock `@sendgrid/mail` module entirely; stub `sgMail.send`.
- **Twilio:** mock the `twilio` constructor; stub `client.messages.create`.
- **KafkaJS / SQS consumer loops:** do not unit-test the polling loop directly — test the handler and router in isolation by invoking them with fixture payloads.
- **p-retry:** in retry unit tests, use `jest.useFakeTimers()` to avoid real wait times.

### Required Test Cases (minimum)
| Module | Required Scenarios |
|---|---|
| `userRegisteredHandler` | Dispatches email only (no phone), dispatches email + SMS, skips duplicate `eventId`, routes to DLQ after retry exhaustion |
| `sesProvider` | Successful send, SES throttle triggers retry, non-retryable 400 skips retry |
| `sendgridProvider` | Successful send, 429 triggers retry, 4xx validation error skips retry |
| `twilioProvider` | Successful send, network error triggers retry, invalid number skips retry |
| `snsProvider` | Successful send, SNS error triggers retry |
| `dlqRouter` | Publishes sanitised record, never includes PII fields in payload |
| `dlqMonitor` | Emits CloudWatch metric, triggers alert when depth exceeds threshold |
| `withRetry` | Retries on retryable error, does not retry on non-retryable error, exhausts attempts and throws |
| `userRegisteredEvent schema` | Valid event passes, missing `eventId` fails, extra fields stripped |

### Running Tests
```bash
npm test                        # run all unit tests
npm test -- --coverage          # run with coverage report
npm test -- --watch             # watch mode during development
npm test -- --testPathPattern=dlq  # run a specific module's tests
```

---

## 6. Docker & CI

### Dockerfile
```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build   # tsc --project tsconfig.build.json --outDir dist

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Run as non-root user
RUN addgroup -S worker && adduser -S worker -G worker
USER worker
CMD ["node", "dist/index.js"]
```

**Rules:**
- Multi-stage build: `deps` → `build` → `runtime`.
- `runtime` stage contains no TypeScript source, no dev dependencies, no test files.
- No secrets or credentials in any layer. Secrets are fetched at runtime from AWS Secrets Manager.
- Image must run as a non-root user.

### docker-compose.yml (local development)
```yaml
version: '3.9'
services:
  notification-worker:
    build: .
    environment:
      - NODE_ENV=development
      - KAFKA_BROKER_URL=kafka:9092
      - EMAIL_PROVIDER=ses
      - SMS_PROVIDER=twilio
      - AWS_REGION=us-east-1
      # Secrets Manager endpoint override for localstack
      - SECRETS_MANAGER_ENDPOINT=http://localstack:4566
    depends_on:
      - kafka
      - localstack

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      Z