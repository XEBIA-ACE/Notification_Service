.PHONY: help install dev build start test lint clean docker-up docker-down migrate

# Default target
help:
	@echo "Notification Service - Available Commands:"
	@echo ""
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make build        - Build for production"
	@echo "  make start        - Start production server"
	@echo "  make test         - Run tests with coverage"
	@echo "  make lint         - Lint and format code"
	@echo "  make docker-up    - Start Docker services"
	@echo "  make docker-down  - Stop Docker services"
	@echo "  make migrate      - Run database migrations"
	@echo "  make clean        - Clean build artifacts"
	@echo ""

# Install dependencies
install:
	npm install
	npm run db:generate

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Start production server
start:
	npm start

# Run tests
test:
	npm test

# Lint and format
lint:
	npm run lint:fix
	npm run format

# Start Docker services
docker-up:
	docker-compose up -d

# Stop Docker services
docker-down:
	docker-compose down

# Run database migrations
migrate:
	npm run migrate:dev

# Setup everything
setup: install docker-up
	@echo "Waiting for services to be ready..."
	@sleep 5
	@make migrate
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start the service."

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf node_modules
	rm -rf coverage

# Full reset
reset: clean docker-down
	docker-compose down -v
	@echo "✅ Full reset complete!"
