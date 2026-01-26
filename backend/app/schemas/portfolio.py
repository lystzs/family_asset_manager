from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Target Portfolio Schemas
class PortfolioBase(BaseModel):
    stock_code: str = Field(..., description="종목코드 (6자리 또는 'CASH')")
    stock_name: str = Field(..., description="종목명")
    target_percentage: float = Field(..., ge=0, le=100, description="목표 비중 (0-100)")

class PortfolioCreate(PortfolioBase):
    account_id: int

class PortfolioUpdate(BaseModel):
    target_percentage: Optional[float] = Field(None, ge=0, le=100)
    stock_name: Optional[str] = None

class PortfolioResponse(PortfolioBase):
    id: int
    account_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Rebalancing Analysis Schemas
class TradeSuggestion(BaseModel):
    stock_code: str
    stock_name: str
    current_qty: int
    current_price: float
    current_value: float
    target_value: float
    diff_value: float
    suggested_qty: int
    action: str  # "BUY", "SELL", "HOLD"

class RebalanceAnalysis(BaseModel):
    user_id: int
    account_id: int
    total_asset: float
    current_cash: float
    items: List[TradeSuggestion]
    summary: dict  # e.g., {"total_target_pct": 100.0, "current_invested_pct": 80.0}
