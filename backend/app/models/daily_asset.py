from sqlalchemy import Column, Integer, BigInteger, Float, Date, ForeignKey, DateTime
from sqlalchemy.sql import func
from backend.app.db.base import Base

class DailyAssetHistory(Base):
    __tablename__ = "daily_asset_history"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    
    total_asset_amount = Column(BigInteger, default=0) # 총 자산
    stock_eval_amount = Column(BigInteger, default=0)  # 주식 평가금
    cash_balance = Column(BigInteger, default=0)       # 예수금
    total_profit_loss = Column(BigInteger, default=0)  # 총 평가손익
    total_profit_rate = Column(Float, default=0.0)     # 총 수익률
    
    daily_profit_loss = Column(BigInteger, default=0)  # 일간 평가손익 (Since Yesterday)
    daily_profit_rate = Column(Float, default=0.0)     # 일간 수익률 (Since Yesterday)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
