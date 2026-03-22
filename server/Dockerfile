FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Create a non-root user for security
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

ENV NODE_ENV=production

# Start the server
CMD ["node", "src/server.js"]
