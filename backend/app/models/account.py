from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.base import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    alias = Column(String) # "아버지-주식"
    hts_id = Column(String, nullable=True) # KIS HTS ID for WebSocket (H0STCNI0)
    
    # Encrypted Fields
    cano = Column(String, unique=True, index=True) # Encrypted Account No (Front 8)
    acnt_prdt_cd = Column(String, index=True) # Account Product Code (Back 2)
    app_key = Column(String) # Encrypted
    app_secret = Column(String) # Encrypted
    
    access_token = Column(String, nullable=True) # Encrypted
    token_expired_at = Column(DateTime, nullable=True)
    
    refresh_token = Column(String, nullable=True) # Encrypted
    
    api_expiry_date = Column(String, nullable=True) # Format: YYYY-MM-DD
    
    user = relationship("User", backref="accounts")
    trade_logs = relationship("TradeLog", back_populates="account", cascade="all, delete-orphan")
    target_portfolios = relationship("TargetPortfolio", back_populates="account", cascade="all, delete-orphan")
    scheduled_orders = relationship("ScheduledOrder", back_populates="account", cascade="all, delete-orphan")
