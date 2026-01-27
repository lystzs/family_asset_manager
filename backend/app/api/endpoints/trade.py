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
            
        # 1. Determine Order Type
        ord_dvsn = "00" # Limit
        if order.strategy_id == "manual_market":
            ord_dvsn = "01" # Market

        # 2. Execute Order
        result = KisClient.place_order(account, db, order.ticker, order.quantity, order.price, order.action, ord_dvsn=ord_dvsn)
        
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

@router.get("/orders/unfilled/{account_id}")
def get_unfilled(account_id: int, db: Session = Depends(get_db)):
    try:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
            
        result = KisClient.get_unfilled_orders(account, db)
        if "output1" in result:
             return result["output1"]
        return result.get("output", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
class RevisionRequest(BaseModel):
    account_id: int
    orgn_odno: str
    quantity: int
    price: float
    ord_dvsn: str = "00"
    all_qty: bool = False

@router.post("/order/revise")
def revise_order(req: RevisionRequest, db: Session = Depends(get_db)):
    try:
        account = db.query(Account).filter(Account.id == req.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
            
        result = KisClient.revise_cancel_order(
            account, db, 
            orgn_odno=req.orgn_odno, 
            revision_type="01", 
            quantity=req.quantity, 
            price=req.price, 
            ord_dvsn=req.ord_dvsn,
            all_qty=req.all_qty
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CancelRequest(BaseModel):
    account_id: int
    orgn_odno: str
    quantity: int = 0 
    all_qty: bool = True

@router.post("/order/cancel")
def cancel_order(req: CancelRequest, db: Session = Depends(get_db)):
    try:
        account = db.query(Account).filter(Account.id == req.account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
            
        result = KisClient.revise_cancel_order(
            account, db, 
            orgn_odno=req.orgn_odno, 
            revision_type="02", 
            quantity=req.quantity, 
            price=0, 
            ord_dvsn="00",
            all_qty=req.all_qty
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/orders/executed/{account_id}")
def get_executed_orders(account_id: int, db: Session = Depends(get_db)):
    try:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        data = KisClient.get_executed_orders(account, db)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
