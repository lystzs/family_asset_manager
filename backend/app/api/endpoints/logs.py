from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models import TradeLog

router = APIRouter()

from backend.app.schemas.trade_log import TradeLogSchema

@router.get("/trade", response_model=List[TradeLogSchema])
def get_trade_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> Any:
    """
    Retrieve trade logs.
    """
    try:
        logs = db.query(TradeLog).order_by(TradeLog.timestamp.desc()).offset(skip).limit(limit).all()
        return logs
    except Exception as e:
        print(f"Error fetching logs: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")
