#!/bin/bash

# Default Configuration
NAS_IP="192.168.68.51"
DEFAULT_NAS_USER="lystzs"  # Change this or input when prompted
DEFAULT_DEST_DIR="/volume1/docker/fam"
DEFAULT_SSH_PORT="50022"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Family Asset Manager Synology Deployment (Hybrid Mode) ===${NC}"
echo "This script will build the Frontend LOCALLY to save resources on your NAS."

# 1. Get Credentials
if [ ! -f "backend/service_account.json" ]; then
    echo -e "${RED}Error: backend/service_account.json not found!${NC}"
    echo "Please download the Google Service Account key and place it in backend/service_account.json"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

read -p "Enter NAS Username [${DEFAULT_NAS_USER}]: " NAS_USER
NAS_USER=${NAS_USER:-$DEFAULT_NAS_USER}

read -p "Enter SSH Port [${DEFAULT_SSH_PORT}]: " SSH_PORT
SSH_PORT=${SSH_PORT:-$DEFAULT_SSH_PORT}

read -p "Enter Target Directory on NAS [${DEFAULT_DEST_DIR}]: " DEST_DIR
DEST_DIR=${DEST_DIR:-$DEFAULT_DEST_DIR}

echo -e "${YELLOW}Target: ${NAS_USER}@${NAS_IP}:${DEST_DIR} (Port: ${SSH_PORT})${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# 2. Local Build Process
echo -e "${YELLOW}[1/5] Building Frontend Locally (Next.js)...${NC}"
cd frontend

# Temporarily rename .env.local to prevent it from being included in production build
if [ -f ".env.local" ]; then
    mv .env.local .env.local.backup
    echo "  (Temporarily disabled .env.local for production build)"
fi

# Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi
echo "Running build with API URL: http://${NAS_IP}:8000"
NEXT_PUBLIC_API_URL="http://${NAS_IP}:8000" npm run build || { 
    # Restore .env.local on build failure
    if [ -f ".env.local.backup" ]; then
        mv .env.local.backup .env.local
    fi
    echo -e "${RED}Build failed!${NC}"; 
    exit 1; 
}

# Restore .env.local after successful build
if [ -f ".env.local.backup" ]; then
    mv .env.local.backup .env.local
    echo "  (Restored .env.local for local development)"
fi

cd ..

# 3. Assemble Artifacts
echo -e "${YELLOW}[2/5] Assembling Deployment Artifacts...${NC}"
rm -rf deploy_build
mkdir -p deploy_build/frontend

# Copy Standalone Output (Server + node_modules)
echo "  - Copying Standalone Build..."
# Note: * does not include hidden files like .next, so we explicitly copy them
cp -r frontend/.next/standalone/* deploy_build/frontend/
cp -r frontend/.next/standalone/.next deploy_build/frontend/

# Copy Public Assets
echo "  - Copying Public Assets..."
cp -r frontend/public deploy_build/frontend/public

# Copy Static Assets
echo "  - Copying Static Files..."
mkdir -p deploy_build/frontend/.next
cp -r frontend/.next/static deploy_build/frontend/.next/static

# Create Production Dockerfile
echo "  - Creating Production Dockerfile..."
cat > deploy_build/frontend/Dockerfile <<EOL
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Install build tools for native module recompilation if needed
RUN apk add --no-cache python3 make g++

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY . .

# Reinstall sharp for Linux/Alpine (remove the copied Mac ARM64 version)
RUN rm -rf node_modules/sharp && npm install sharp


RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
EOL

# 4. Transfer Files
echo -e "${YELLOW}[3/5] Compressing and Transferring...${NC}"

# Frontend
echo "  - Transferring Frontend..."
tar -czf frontend_deploy.tar.gz -C deploy_build frontend
scp -O -P "${SSH_PORT}" frontend_deploy.tar.gz "${NAS_USER}@${NAS_IP}:${DEST_DIR}/"
rm frontend_deploy.tar.gz
rm -rf deploy_build

# Backend (Standard Copy)
echo "  - Transferring Backend..."
tar --exclude='venv' --exclude='__pycache__' --exclude='.git' --exclude='tests' --exclude='data' -czf backend.tar.gz backend
scp -O -P "${SSH_PORT}" backend.tar.gz "${NAS_USER}@${NAS_IP}:${DEST_DIR}/"
rm backend.tar.gz

# Config
# Config
echo "  - Transferring Config..."
scp -O -P "${SSH_PORT}" docker-compose.yml "${NAS_USER}@${NAS_IP}:${DEST_DIR}/"

# Create temporary production .env
echo "  - Preparing Production .env..."
cp .env .env.tmp
# Force Enable Scheduler and Set Environment to Production
# check if SCHEDULER_ENABLED exists, if so replace it, else append it
if grep -q "SCHEDULER_ENABLED" .env.tmp; then
    sed -i '' 's/SCHEDULER_ENABLED=.*/SCHEDULER_ENABLED=True/' .env.tmp
else
    echo "SCHEDULER_ENABLED=True" >> .env.tmp
fi

if grep -q "APP_ENV" .env.tmp; then
    sed -i '' 's/APP_ENV=.*/APP_ENV=prd/' .env.tmp
else
    echo "APP_ENV=prd" >> .env.tmp
fi

scp -O -P "${SSH_PORT}" .env.tmp "${NAS_USER}@${NAS_IP}:${DEST_DIR}/.env"
rm .env.tmp

# 5. Remote Setup & Deploy
echo -e "${YELLOW}[4/5] Extracting on NAS...${NC}"
ssh -t -p "${SSH_PORT}" "${NAS_USER}@${NAS_IP}" "mkdir -p ${DEST_DIR} && cd ${DEST_DIR} && \
    rm -rf frontend backend && \
    tar -xzf frontend_deploy.tar.gz && rm frontend_deploy.tar.gz && \
    tar -xzf backend.tar.gz && rm backend.tar.gz"

echo -e "${YELLOW}[5/5] Deploying Containers...${NC}"
DEPLOY_CMD="export PATH=\$PATH:/usr/local/bin && \
    if [ -x /usr/local/bin/docker ]; then \
        /usr/local/bin/docker compose up -d --build; \
    elif command -v docker-compose &> /dev/null; then \
        docker-compose up -d --build; \
    elif command -v docker &> /dev/null; then \
        docker compose up -d --build; \
    elif [ -f /usr/local/bin/docker-compose ]; then \
        /usr/local/bin/docker-compose up -d --build; \
    else \
        echo 'Error: docker-compose not found.'; \
        exit 1; \
    fi"

ssh -t -p "${SSH_PORT}" "${NAS_USER}@${NAS_IP}" "cd ${DEST_DIR} && $DEPLOY_CMD"

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo "Backend: http://${NAS_IP}:8000/docs"
echo "Frontend: http://${NAS_IP}:3000"
