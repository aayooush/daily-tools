# syntax=docker/dockerfile:1

# ─── Builder ───────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install system deps for sharp (libvips) + FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libvips-dev \
    libpng-dev \
    libwebp-dev \
    libgif-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ─── Runtime ───────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Install FFmpeg (needed for video-trim tool)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy only what's needed from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose and start
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
