# ============================================
# Multi-stage Dockerfile for Next.js
# Supports: Development, Staging, Production
# ============================================

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies based on the preferred package manager
RUN \
  if [ -f bun.lockb ]; then \
    corepack enable && bun install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  elif [ -f yarn.lock ]; then \
    corepack enable && yarn install --frozen-lockfile; \
  else \
    npm ci; \
  fi

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install build dependencies if needed
RUN apk add --no-cache libc6-compat

# Enable Bun if using bun
RUN if [ -f bun.lockb ]; then corepack enable; fi

# Build arguments for environment
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_ENV
ARG DATABASE_URL
ARG AUTH_SECRET
ARG NEXT_PUBLIC_APP_NAME

ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV DATABASE_URL=${DATABASE_URL}
ENV AUTH_SECRET=${AUTH_SECRET}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}

# Build Next.js application
RUN \
  if [ -f bun.lockb ]; then \
    bun run build; \
  else \
    npm run build; \
  fi

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install production dependencies only
RUN apk add --no-cache libc6-compat

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy standalone output if using standalone mode
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node --eval "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]

# ============================================
# Stage 4: Development (for local dev)
# ============================================
FROM node:20-alpine AS development
WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json bun.lockb* ./

# Enable Bun if using bun
RUN if [ -f bun.lockb ]; then corepack enable; fi

# Install all dependencies (including devDependencies)
RUN \
  if [ -f bun.lockb ]; then \
    bun install; \
  else \
    npm install; \
  fi

# Copy source code
COPY . .

# Switch to non-root user for development too
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs -G nodejs

USER nextjs

# Expose port
EXPOSE 3000

# Start development server
CMD ["bun", "run", "dev"]
