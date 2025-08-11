# Use a lighter base image
FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Set memory limit and optimization flags
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV NPM_CONFIG_LOGLEVEL=warn

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./
COPY .npmrc ./

# Install ALL dependencies (including dev dependencies for build)
# Use --maxsockets=1 to reduce memory usage during install
RUN npm ci --maxsockets=1 --prefer-offline

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - use even lighter image
FROM node:18-slim AS production

WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nestjs

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install only production dependencies
RUN npm ci --only=production --maxsockets=1 --prefer-offline && npm cache clean --force

# Copy built application and prisma
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nestjs

EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
