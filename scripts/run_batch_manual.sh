#!/bin/bash

# Configuration
NAS_IP="192.168.68.51"
NAS_USER="lystzs"
SSH_PORT="50022"
DEST_DIR="/volume1/docker/fam"

# 1. Copy the script to NAS (into the backend directory mounted/copied in container)
# Note: In our GHCR setup, the code is inside the image. We can copy this file to /tmp/manual_run.py inside the container via docker cp or just run a snippet.
# Better yet, since we might not have the file inside the container, let's just copy it to the NAS host first, then copy to container, then run.

echo "Uploading manual trigger script..."
scp -O -P "${SSH_PORT}" backend/manual_batch_run.py "${NAS_USER}@${NAS_IP}:${DEST_DIR}/manual_batch_run.py"

echo "Executing script inside 'fam-backend' container..."
ssh -t -p "${SSH_PORT}" "${NAS_USER}@${NAS_IP}" "
    export PATH=\$PATH:/usr/local/bin && \
    cd ${DEST_DIR} && \
    (sudo docker cp manual_batch_run.py fam-backend:/app/backend/manual_batch_run.py || sudo /usr/local/bin/docker cp manual_batch_run.py fam-backend:/app/backend/manual_batch_run.py) && \
    (sudo docker exec fam-backend python backend/manual_batch_run.py || sudo /usr/local/bin/docker exec fam-backend python backend/manual_batch_run.py)
"
