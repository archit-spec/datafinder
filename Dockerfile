# Dockerfile
FROM oven/bun:latest as builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY . .

# Build application
RUN bun run build

# Production image
FROM oven/bun:latest

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# Expose port
EXPOSE 3000

# Start server
CMD ["bun", "start"]
