#!/bin/bash

# Configuration
NAS_IP="192.168.68.51"
NAS_USER="lystzs"
NAS_PORT="50022"
NAS_DIR="/volume1/docker/fam"
LOCAL_DB="data/fam.db"
REMOTE_DB="$NAS_DIR/data/fam.db"
NAS_PASS="s2010B491$"

echo "=== FAM Database Sync: Local -> NAS ==="

# 1. Check local file
if [ ! -f "$LOCAL_DB" ]; then
    echo "Error: Local DB $LOCAL_DB not found!"
    exit 1
fi

# 2. Stop Containers on NAS
echo "[1/4] Stopping Backend Container on NAS..."
# Try to find container name matching 'fam-backend'
CONTAINER_NAME=$(ssh -p $NAS_PORT $NAS_USER@$NAS_IP "echo '$NAS_PASS' | sudo -S /usr/local/bin/docker ps --format '{{.Names}}' | grep fam-backend | head -n 1")
if [ -z "$CONTAINER_NAME" ]; then
    echo "Warning: fam-backend container not found. Proceeding with sync..."
else
    echo "Found container: $CONTAINER_NAME. Stopping..."
    ssh -p $NAS_PORT $NAS_USER@$NAS_IP "echo '$NAS_PASS' | sudo -S /usr/local/bin/docker stop $CONTAINER_NAME"
fi

# 3. Backup Remote DB and fix permissions
echo "[2/4] Backing up and preparing permissions..."
ssh -p $NAS_PORT $NAS_USER@$NAS_IP "echo '$NAS_PASS' | sudo -S cp $REMOTE_DB ${REMOTE_DB}.bak_$(date +%Y%m%d_%H%M%S) && echo '$NAS_PASS' | sudo -S chmod 666 $REMOTE_DB"

# 4. Sync
echo "[3/4] Uploading Local DB to NAS..."
# scp can fail if remote is owned by root, so we upload to a temp location and move
cat "$LOCAL_DB" | ssh -p $NAS_PORT $NAS_USER@$NAS_IP "cat > /tmp/fam.db"
ssh -p $NAS_PORT $NAS_USER@$NAS_IP "echo '$NAS_PASS' | sudo -S mv /tmp/fam.db $REMOTE_DB && echo '$NAS_PASS' | sudo -S chown lystzs:users $REMOTE_DB"

# 5. Start Containers on NAS
echo "[4/4] Restarting Backend Container on NAS..."
if [ ! -z "$CONTAINER_NAME" ]; then
    ssh -p $NAS_PORT $NAS_USER@$NAS_IP "echo '$NAS_PASS' | sudo -S /usr/local/bin/docker start $CONTAINER_NAME"
else
    # Fallback to docker-compose if we are in the right dir
    ssh -p $NAS_PORT $NAS_USER@$NAS_IP "cd $NAS_DIR && echo '$NAS_PASS' | sudo -S /usr/local/bin/docker-compose up -d backend"
fi

echo "=== Sync Complete! ==="
