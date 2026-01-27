from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings

app = FastAPI(
    title="Family Asset Manager (FAM) Backend",
    description="API-First Infrastructure for Family Wealth & Quant Trading",
    version="3.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    from backend.app.db.base import Base
    from backend.app.db.session import engine
    from backend.app.models import User, Account, TradeLog, Stock, TargetPortfolio, DailyAssetHistory
    from backend.app.core.scheduler import start_scheduler
    
    # Create Tables
    print(f"[Debug] User Columns: {User.__table__.columns.keys()}")
    Base.metadata.create_all(bind=engine)
    print("[DB] Tables created (if not exist).")
    
    # Start Scheduler
    start_scheduler()

from backend.app.api.api import api_router
app.include_router(api_router, prefix="/v1")

@app.get("/")
def root():
    return {
        "message": "Welcome to FAM Backend API",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}
