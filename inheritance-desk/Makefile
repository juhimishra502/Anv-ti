# CURDIR (not realpath/dirname) so a space in the path — e.g. "Govt sector" —
# survives as a single value. Run make from this directory.
ROOT_DIR := $(CURDIR)
ENV_FILE := $(ROOT_DIR)/.env.local
IMAGE_NAME := inheritance-desk
SERVICE := inheritance-desk

.PHONY: help dev build start lint typecheck db-schema db-seed \
	docker-build docker-run \
	deploy deploy-ensure deploy-vars deploy-up

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ── Development ──────────────────────────────────────────────

dev: ## Start the Next.js dev server
	cd "$(ROOT_DIR)" && npm run dev

build: ## Build the app for production (standalone output)
	cd "$(ROOT_DIR)" && npm run build

start: ## Run the production build locally
	cd "$(ROOT_DIR)" && npm run start

typecheck: ## Type-check the project
	cd "$(ROOT_DIR)" && npm run typecheck

lint: ## Lint the project
	cd "$(ROOT_DIR)" && npm run lint

# ── Database (Neon) ──────────────────────────────────────────

db-schema: ## Apply lib/db/schema.sql to Neon (uses .env.local)
	cd "$(ROOT_DIR)" && node --env-file=.env.local scripts/apply-schema.mjs

db-seed: ## Seed reference data into Neon (uses .env.local)
	cd "$(ROOT_DIR)" && node --env-file=.env.local scripts/seed-db.mjs

# ── Docker (optional; requires local Docker) ─────────────────

docker-build: ## Build the Railway Docker image locally
	cd "$(ROOT_DIR)" && docker build -t $(IMAGE_NAME) .

docker-run: ## Run the image locally on port 3000
	cd "$(ROOT_DIR)" && docker run --rm -p 3000:3000 --env-file .env.local $(IMAGE_NAME)

# ── Railway Deployment ───────────────────────────────────────

deploy: deploy-ensure deploy-vars db-schema deploy-up ## Link Railway, upload vars, apply schema, deploy

deploy-ensure: ## Create or link a Railway project and service
	@if ! railway status >/dev/null 2>&1; then \
		echo "No Railway project linked. Creating one..."; \
		railway init --name $(SERVICE); \
	else \
		echo "Railway project already linked."; \
	fi
	@if ! railway service list 2>/dev/null | grep -qi "$(SERVICE)"; then \
		echo "Creating service $(SERVICE)..."; \
		railway add --service $(SERVICE) --variables "NODE_ENV=production"; \
	else \
		echo "Service $(SERVICE) already exists."; \
	fi
	@railway service link $(SERVICE) >/dev/null 2>&1 || true

deploy-vars: ## Upload .env.local values to the linked Railway service
	@echo "Uploading .env.local to Railway (deploys held until 'railway up')..."
	@grep -v '^#' "$(ENV_FILE)" | grep -v '^[[:space:]]*$$' | while IFS= read -r line; do \
		railway variable set "$$line" --service $(SERVICE) --skip-deploys >/dev/null && echo "  set $${line%%=*}"; \
	done
	@railway variable set "NODE_ENV=production" --service $(SERVICE) --skip-deploys >/dev/null

deploy-up: ## Deploy the current directory to Railway
	cd "$(ROOT_DIR)" && railway up -y --service $(SERVICE)
