# ============================================
# Makefile for Docker Operations
# ============================================

.PHONY: help dev build up down restart logs clean install staging prod backup restore

# Default target
help:
	@echo "Available commands:"
	@echo "  make dev         - Start development environment"
	@echo "  make build       - Build Docker images"
	@echo "  make up          - Start containers"
	@echo "  make down        - Stop containers"
	@echo "  make restart     - Restart containers"
	@echo "  make logs        - View logs"
	@echo "  make clean       - Remove all containers and volumes"
	@echo "  make install     - Install dependencies"
	@echo "  make staging     - Deploy to staging"
	@echo "  make prod        - Deploy to production"
	@echo "  make backup      - Backup database"
	@echo "  make restore     - Restore database from backup"

# ============================================
# Development
# ============================================
dev:
	docker-compose up --build
dev-detach:
	docker-compose up --build -d
dev-tools:
	docker-compose --profile tools up

# ============================================
# Build
# ============================================
build:
	docker-compose build
build-staging:
	docker-compose -f docker-compose.staging.yml build
build-prod:
	docker-compose -f docker-compose.prod.yml build

# ============================================
# Container Management
# ============================================
up:
	docker-compose up -d
up-staging:
	docker-compose -f docker-compose.staging.yml up -d
up-prod:
	docker-compose -f docker-compose.prod.yml up -d

down:
	docker-compose down
down-staging:
	docker-compose -f docker-compose.staging.yml down
down-prod:
	docker-compose -f docker-compose.prod.yml down

restart:
	docker-compose restart
restart-staging:
	docker-compose -f docker-compose.staging.yml restart
restart-prod:
	docker-compose -f docker-compose.prod.yml restart

# ============================================
# Logs
# ============================================
logs:
	docker-compose logs -f app
logs-staging:
	docker-compose -f docker-compose.staging.yml logs -f app
logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f app
logs-all:
	docker-compose logs -f

# ============================================
# Database Operations
# ============================================
backup:
	@echo "Backing up database..."
	@mkdir -p backups
	@docker-compose exec -T postgres pg_dump -U arzi arzi_dev > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup completed: backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

backup-staging:
	@echo "Backing up staging database..."
	@mkdir -p backups/staging
	@docker-compose -f docker-compose.staging.yml exec -T postgres pg_dump -U arzi arzi_staging > backups/staging/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Staging backup completed"

backup-prod:
	@echo "Backing up production database..."
	@mkdir -p backups/production
	@docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U arzi arzi > backups/production/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Production backup completed"

restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup file path: " backup_path; \
	docker-compose exec -T postgres psql -U arzi arzi_dev < $$backup_path
	@echo "Restore completed"

# ============================================
# Prisma Operations
# ============================================
prisma-generate:
	docker-compose exec app bun prisma generate
prisma-push:
	docker-compose exec app bun prisma db push
prisma-migrate:
	docker-compose exec app bun prisma migrate dev
prisma-seed:
	docker-compose exec app bun prisma db seed
prisma-studio:
	docker-compose exec app bun prisma studio

# ============================================
# Shell Access
# ============================================
shell-app:
	docker-compose exec app sh
shell-postgres:
	docker-compose exec postgres psql -U arzi arzi_dev
shell-redis:
	docker-compose exec redis redis-cli -a redis_password

# ============================================
# Clean
# ============================================
clean:
	docker-compose down -v
	rm -rf backups/*
	@echo "All containers, volumes, and backups removed"

clean-images:
	docker rmi $$(docker images -q arzi-starterkit*)

# ============================================
# Deployment
# ============================================
staging:
	@echo "Deploying to staging..."
	@docker-compose -f docker-compose.staging.yml up -d --build
	@echo "Staging deployment completed"

prod:
	@echo "Deploying to production..."
	@docker-compose -f docker-compose.prod.yml up -d --build
	@echo "Production deployment completed"

# ============================================
# Health Check
# ============================================
health:
	@echo "Checking container health..."
	@docker-compose ps
	@echo ""
	@echo "Application health:"
	@curl -sf http://localhost:3000/api/health || echo "Application is not responding"

# ============================================
# Install Dependencies
# ============================================
install:
	docker-compose run --rm app bun install
install-staging:
	docker-compose -f docker-compose.staging.yml run --rm app bun install
install-prod:
	docker-compose -f docker-compose.prod.yml run --rm app bun install

# ============================================
# Tests
# ============================================
test:
	docker-compose exec app bun test
test-watch:
	docker-compose exec app bun test --watch
test-coverage:
	docker-compose exec app bun test --coverage
