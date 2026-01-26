from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db.base import Base

class TradeLog(Base):
    __tablename__ = "trade_logs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True) # made nullable for backward compatibility or existing logs? No, pure fresh start. make it nullable just in case.
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    strategy_id = Column(String) # e.g. "manual", "magic_formula"
    ticker = Column(String)
    action = Column(String) # BUY, SELL
    price = Column(Float)
    quantity = Column(Integer)
    status = Column(String) # SUCCESS, FAILED
    message = Column(Text, nullable=True)
    
    account = relationship("Account", back_populates="trade_logs")
