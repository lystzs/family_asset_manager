"""
목표 포트폴리오 모델
사용자별 종목 목표 보유 비율 관리
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db.base import Base


class TargetPortfolio(Base):
    """사용자별 목표 포트폴리오"""
    __tablename__ = "target_portfolios"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    stock_code = Column(String(10), nullable=False, comment="종목코드 (6자리)")
    stock_name = Column(String(100), nullable=False, comment="종목명 (캐싱)")
    target_percentage = Column(Float, nullable=False, comment="목표 비율 (0-100)")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="수정일시")

    account = relationship("Account", back_populates="target_portfolios")

    # 복합 유니크 제약: 한 계좌가 같은 종목 중복 설정 불가
    __table_args__ = (
        UniqueConstraint('account_id', 'stock_code', name='uix_account_stock'),
    )

    def __repr__(self):
        return f"<TargetPortfolio(account_id={self.account_id}, stock={self.stock_name}, target={self.target_percentage}%)>"
