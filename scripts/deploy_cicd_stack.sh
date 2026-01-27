#!/bin/bash

# Configuration
NAS_IP="192.168.68.51"
NAS_USER="lystzs"
DEST_DIR="/volume1/docker/fam"
SSH_PORT="50022"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Updating NAS Configuration for CI/CD ===${NC}"

# 1. Update docker-compose.yml
echo -e "${YELLOW}Uploading docker-compose.yml...${NC}"
scp -P "${SSH_PORT}" docker-compose.yml "${NAS_USER}@${NAS_IP}:${DEST_DIR}/"

# 2. Restart Containers
echo -e "${YELLOW}Restarting Containers on NAS...${NC}"
ssh -p "${SSH_PORT}" "${NAS_USER}@${NAS_IP}" "cd ${DEST_DIR} && \
    export GITHUB_REPOSITORY_OWNER=lystzs && \
    sudo docker compose down && \
    sudo docker compose pull && \
    sudo docker compose up -d"

echo -e "${GREEN}=== Update Complete! ===${NC}"
echo "Use 'docker compose logs -f' on NAS to check status if needed."
