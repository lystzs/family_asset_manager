#!/bin/bash
# scripts/setup_cicd.sh

# Configuration
NAS_IP="192.168.68.51"
DEFAULT_NAS_USER="admin"
DEFAULT_DEST_DIR="/volume1/docker/fam"
DEFAULT_SSH_PORT="50022"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Family Asset Manager CI/CD Setup ===${NC}"
echo "This script configures your NAS to pull images from GitHub Container Registry."

# 1. Get Credentials
read -p "Enter NAS Username [${DEFAULT_NAS_USER}]: " NAS_USER
NAS_USER=${NAS_USER:-$DEFAULT_NAS_USER}

read -p "Enter SSH Port [${DEFAULT_SSH_PORT}]: " SSH_PORT
SSH_PORT=${SSH_PORT:-$DEFAULT_SSH_PORT}

read -p "Enter Target Directory on NAS [${DEFAULT_DEST_DIR}]: " DEST_DIR
DEST_DIR=${DEST_DIR:-$DEFAULT_DEST_DIR}

echo -e "\n${YELLOW}GitHub Authentication Required${NC}"
echo "You need a Personal Access Token (PAT) with 'read:packages' scope."
echo "Generate one here: https://github.com/settings/tokens"
read -s -p "Enter GitHub Personal Access Token (PAT): " GH_PAT
echo
read -p "Enter GitHub Username: " GH_USER

# 2. Transfer updated docker-compose.yml
echo -e "\n${YELLOW}[1/3] Updating docker-compose.yml on NAS...${NC}"
scp -O -P "${SSH_PORT}" docker-compose.yml "${NAS_USER}@${NAS_IP}:${DEST_DIR}/"

# 3. Setup Remote Environment
echo -e "${YELLOW}[2/3] Configuring NAS Docker...${NC}"
REMOTE_CMD="export PATH=\$PATH:/usr/local/bin && \
    echo '${GH_PAT}' | sudo docker login ghcr.io -u '${GH_USER}' --password-stdin && \
    cd ${DEST_DIR} && \
    echo 'GITHUB_REPOSITORY_OWNER=${GH_USER}' > .env && \
    echo 'GITHUB_ACTOR=${GH_USER}' >> .env && \
    echo 'GITHUB_TOKEN=${GH_PAT}' >> .env"

ssh -t -p "${SSH_PORT}" "${NAS_USER}@${NAS_IP}" "${REMOTE_CMD}"

# 4. Restart Services
echo -e "${YELLOW}[3/3] Restarting with Watchtower...${NC}"
START_CMD="export PATH=\$PATH:/usr/local/bin && \
    cd ${DEST_DIR} && \
    (sudo docker compose up -d || sudo docker-compose up -d || sudo /usr/local/bin/docker-compose up -d)"

ssh -t -p "${SSH_PORT}" "${NAS_USER}@${NAS_IP}" "${START_CMD}"

echo -e "${GREEN}=== CI/CD Setup Complete! ===${NC}"
echo "Your NAS is now monitoring for new updates every 5 minutes."
