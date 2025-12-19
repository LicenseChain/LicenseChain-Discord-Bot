# Use Node.js LTS version
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install system dependencies for sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Copy .env.example as .env template (users should mount their own .env)
RUN cp .env.example .env 2>/dev/null || true

# Create non-root user for security
# Check if UID 1000 exists, if so rename the user, otherwise create new user
RUN if id -u 1000 >/dev/null 2>&1; then \
        EXISTING_USER=$(id -un 1000); \
        if [ "$EXISTING_USER" != "appuser" ]; then \
            usermod -l appuser $EXISTING_USER && \
            groupmod -n appuser $(id -gn 1000); \
        fi; \
    else \
        useradd -m -u 1000 appuser; \
    fi && \
    chown -R 1000:1000 /app
USER appuser

# Expose port (default is 3004, can be overridden with PORT env var)
EXPOSE 3004

# Health check - checks /health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); const port = process.env.PORT || 3004; http.get(`http://localhost:${port}/health`, (r) => {let data=''; r.on('data', d=>data+=d); r.on('end', ()=>{process.exit(r.statusCode===200?0:1)});}).on('error', ()=>{process.exit(1)});"

# Start the application
CMD ["npm", "start"]

