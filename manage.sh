#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=8000
FRONTEND_PORT=3000
PROJECT_ROOT=$(pwd)

function show_help {
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start Backend and Frontend in background"
    echo "  stop        Stop Backend and Frontend"
    echo "  restart     Restart both services"
    echo "  status      Check if services are running"
    echo "  logs        Tail logs (backend | frontend)"
    echo "  analyze     Analyze backend error logs"
    echo ""
}

function start_services {
    echo -e "${YELLOW}Starting services...${NC}"

    # Start Backend
    if lsof -i :$BACKEND_PORT > /dev/null; then
        echo -e "${RED}Backend is already running on port $BACKEND_PORT${NC}"
    else
        echo "Starting Backend (FastAPI)..."
        # Run in background, redirect logs
        nohup ./venv/bin/python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port $BACKEND_PORT > backend.log 2>&1 &
        echo -e "${GREEN}Backend started (PID: $!)${NC}"
    fi

    # Start Frontend
    if lsof -i :$FRONTEND_PORT > /dev/null; then
        echo -e "${RED}Frontend is already running on port $FRONTEND_PORT${NC}"
    else
        echo "Starting Frontend (Next.js)..."
        cd frontend
        nohup npm run dev > ../frontend.log 2>&1 &
        cd ..
        echo -e "${GREEN}Frontend started (PID: $!)${NC}"
    fi
}

function stop_services {
    echo -e "${YELLOW}Stopping services...${NC}"
    
    # Kill Backend
    BACKEND_PID=$(lsof -ti :$BACKEND_PORT)
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID
        echo -e "${GREEN}Backend stopped (PID: $BACKEND_PID)${NC}"
    else
        echo "Backend is not running."
    fi

    # Kill Frontend
    FRONTEND_PID=$(lsof -ti :$FRONTEND_PORT)
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID
        echo -e "${GREEN}Frontend stopped (PID: $FRONTEND_PID)${NC}"
    else
        echo "Frontend is not running."
    fi
}

function check_status {
    echo -e "${YELLOW}Checking status...${NC}"
    
    if lsof -i :$BACKEND_PORT > /dev/null; then
        echo -e "Backend: ${GREEN}RUNNING${NC} (Port $BACKEND_PORT)"
    else
        echo -e "Backend: ${RED}STOPPED${NC}"
    fi

    if lsof -i :$FRONTEND_PORT > /dev/null; then
        echo -e "Frontend: ${GREEN}RUNNING${NC} (Port $FRONTEND_PORT)"
    else
        echo -e "Frontend: ${RED}STOPPED${NC}"
    fi
}

function view_logs {
    TARGET=$1
    if [ "$TARGET" == "backend" ]; then
        echo -e "${YELLOW}Tailing backend logs... (Ctrl+C to exit)${NC}"
        tail -f backend.log
    elif [ "$TARGET" == "frontend" ]; then
        echo -e "${YELLOW}Tailing frontend logs... (Ctrl+C to exit)${NC}"
        tail -f frontend.log
    else
        echo "Usage: ./manage.sh logs <backend|frontend>"
    fi
}

function analyze_logs {
    echo -e "${YELLOW}Analyzing Backend Errors...${NC}"
    if [ -f backend.log ]; then
        grep -i "error" backend.log | tail -n 20
        echo -e "${YELLOW}--- End of Analysis ---${NC}"
    else
        echo "backend.log not found."
    fi
}

# Main Dispatcher
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs $2
        ;;
    analyze)
        analyze_logs
        ;;
    *)
        show_help
        ;;
esac
