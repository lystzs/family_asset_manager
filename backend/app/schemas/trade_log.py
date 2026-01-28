from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TradeLogSchema(BaseModel):
    id: int
    account_id: Optional[int]
    timestamp: datetime
    strategy_id: Optional[str]
    ticker: Optional[str]
    action: Optional[str]
    price: Optional[float]
    quantity: Optional[int]
    status: Optional[str]
    message: Optional[str]

    class Config:
        from_attributes = True
