# Use a more compatible Node.js base image for builds (Alpine has known issues with memory + Vite + native deps)
FROM node:20.10-slim AS builder

WORKDIR /app

# Set memory allocation globally
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all app code
COPY . .

# Generate Prisma client (if you're using it)
RUN npx prisma generate

# Build the app (this is where memory issues usually hit)
RUN npm run build

# Optional: prune dev dependencies
RUN npm prune --production

# --- Final minimal image ---
FROM node:20.10-alpine3.18

WORKDIR /app

# Only copy production code from builder
COPY --from=builder /app /app

# Default port (adjust if needed)
EXPOSE 3000

# Run the app
CMD ["npm", "run", "docker-start"]
