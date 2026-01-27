from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.session import get_db
from backend.app.models import ScheduledOrder, Account

router = APIRouter()

from typing import Optional

class ScheduleRequest(BaseModel):
    account_id: int
    ticker: str
    stock_name: str
    action: str
    total_quantity: Optional[int] = None
    daily_quantity: Optional[int] = None
    total_amount: Optional[int] = None
    daily_amount: Optional[int] = None
    order_mode: str = "QUANTITY" # QUANTITY or AMOUNT

class ScheduleResponse(BaseModel):
    id: int
    stock_name: str
    total_quantity: Optional[int] = None
    daily_quantity: Optional[int] = None
    total_amount: Optional[int] = None
    daily_amount: Optional[int] = None
    executed_quantity: int
    executed_amount: int
    order_mode: str
    status: str
    created_at: str

    class Config:
        from_attributes = True

@router.post("/schedule", response_model=ScheduleResponse)
def create_scheduled_order(req: ScheduleRequest, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == req.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    order = ScheduledOrder(
        account_id=req.account_id,
        stock_code=req.ticker,
        stock_name=req.stock_name,
        action=req.action,
        order_mode=req.order_mode,
        total_quantity=req.total_quantity,
        daily_quantity=req.daily_quantity,
        total_amount=req.total_amount,
        daily_amount=req.daily_amount,
        status="ACTIVE"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return ScheduleResponse(
        id=order.id,
        stock_name=order.stock_name,
        total_quantity=order.total_quantity,
        daily_quantity=order.daily_quantity,
        total_amount=order.total_amount,
        daily_amount=order.daily_amount,
        executed_quantity=order.executed_quantity,
        executed_amount=order.executed_amount,
        order_mode=order.order_mode,
        status=order.status,
        created_at=order.created_at.isoformat()
    )

@router.get("/list/{account_id}")
def list_scheduled_orders(account_id: int, db: Session = Depends(get_db)):
    orders = db.query(ScheduledOrder).filter(ScheduledOrder.account_id == account_id).all()
    return orders

@router.delete("/{order_id}")
def cancel_scheduled_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(ScheduledOrder).filter(ScheduledOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = "CANCELLED"
    db.commit()
    return {"message": "Order cancelled"}
