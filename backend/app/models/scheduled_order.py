from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.base import Base

class ScheduledOrder(Base):
    __tablename__ = "scheduled_orders"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    
    stock_code = Column(String, nullable=False)
    stock_name = Column(String, nullable=False)
    action = Column(String, nullable=False) # BUY / SELL
    
    total_quantity = Column(Integer, nullable=False)
    daily_quantity = Column(Integer, nullable=False)
    executed_quantity = Column(Integer, default=0)
    
    status = Column(String, default="ACTIVE") # ACTIVE, COMPLETED, CANCELLED
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    account = relationship("Account", back_populates="scheduled_orders")
