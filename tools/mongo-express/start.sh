#!/bin/bash
# Start Mongo-Express

# Get onto the correct directory
cd "$(dirname "$0")"

# Start the container
docker compose up -d

# Notify user
echo "Mongo-Express is starting..."
echo "Access it at http://localhost:8081"
