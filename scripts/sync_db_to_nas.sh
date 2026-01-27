#!/bin/bash

# Configuration (match deploy_to_nas.sh)
NAS_IP="192.168.68.51"
DEFAULT_NAS_USER="admin"
DEFAULT_DEST_DIR="/volume1/docker/fam"
DEFAULT_SSH_PORT="50022"
LOCAL_DB_PATH="backend/family_asset.db"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Family Asset Manager Database Sync (Local -> NAS) ===${NC}"

# Get Credentials
read -p "Enter NAS Username [${DEFAULT_NAS_USER}]: " NAS_USER
NAS_USER=${NAS_USER:-$DEFAULT_NAS_USER}

read -p "Enter SSH Port [${DEFAULT_SSH_PORT}]: " SSH_PORT
SSH_PORT=${SSH_PORT:-$DEFAULT_SSH_PORT}

read -p "Enter Target Directory on NAS [${DEFAULT_DEST_DIR}]: " DEST_DIR
DEST_DIR=${DEST_DIR:-$DEFAULT_DEST_DIR}

echo -e "${YELLOW}Source: ${LOCAL_DB_PATH}${NC}"
echo -e "${YELLOW}Target: ${NAS_USER}@${NAS_IP}:${DEST_DIR}/backend/family_asset.db${NC}"
echo -e "${RED}WARNING: This will OVERWRITE the database on the NAS.${NC}"
read -p "Are you sure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# 1. Stop Backend to prevent corruption
echo -e "${YELLOW}[1/3] Stopping remote backend container...${NC}"
ssh -t -p "${SSH_PORT}" "${NAS_USER}@${NAS_IP}" "cd ${DEST_DIR} && export PATH=\$PATH:/usr/local/bin && (sudo docker compose stop backend || sudo docker-compose stop backend || sudo /usr/local/bin/docker-compose stop backend)"

# 2. Transfer Database
echo -e "${YELLOW}[2/3] Uploading database...${NC}"
# Use scp with -O for compatibility if needed
scp -O -P "${SSH_PORT}" "${LOCAL_DB_PATH}" "${NAS_USER}@${NAS_IP}:${DEST_DIR}/${LOCAL_DB_PATH}"

# 3. Restart Backend
echo -e "${YELLOW}[3/3] Restarting backend container...${NC}"
ssh -t -p "${SSH_PORT}" "${NAS_USER}@${NAS_IP}" "cd ${DEST_DIR} && export PATH=\$PATH:/usr/local/bin && (sudo docker compose start backend || sudo docker-compose start backend || sudo /usr/local/bin/docker-compose start backend)"

echo -e "${GREEN}=== Database Sync Complete ===${NC}"
