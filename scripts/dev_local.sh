#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting Family Asset Manager (Local Dev) ===${NC}"

# Function to kill child processes on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down servers...${NC}"
    kill $(jobs -p) 2>/dev/null
}
trap cleanup EXIT

# 1. Start Backend
echo -e "${BLUE}[Backend] Starting FastAPI on port 8000...${NC}"
# Check for venv in backend directory
if [ -d "backend/venv" ]; then
    source backend/venv/bin/activate
elif [ -d "backend/.venv" ]; then
    source backend/.venv/bin/activate
else
    echo "Warning: No venv found. Running with system python3..."
fi

# Run uvicorn in background from root
python3 -m uvicorn backend.app.main:app --reload --port 8000 &
BACKEND_PID=$!

# 2. Start Frontend
echo -e "${BLUE}[Frontend] Starting Next.js on port 3000...${NC}"
cd frontend
# Run next dev
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
