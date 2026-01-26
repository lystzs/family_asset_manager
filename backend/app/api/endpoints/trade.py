from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.core.kis_client import KisClient
from backend.app.db.session import get_db
from backend.app.models import TradeLog, Account

router = APIRouter()

class OrderRequest(BaseModel):
    account_id: int
    ticker: str
    quantity: int
    price: float
    action: str # BUY / SELL
    strategy_id: str = "manual"

@router.post("/order")
def place_order(order: OrderRequest, db: Session = Depends(get_db)):
    try:
        # Get Account
        account = db.query(Account).filter(Account.id == order.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
            
        # 1. Execute Order
        result = KisClient.place_order(account, db, order.ticker, order.quantity, order.price, order.action)
        
        # 2. Log to DB
        log = TradeLog(
            strategy_id=order.strategy_id,
            ticker=order.ticker,
            action=order.action,
            price=order.price,
            quantity=order.quantity,
            status="SUCCESS" if result.get("rt_cd") == "0" else "FAILED",
            message=result.get("msg1", "")
        )
        db.add(log)
        db.commit()
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
