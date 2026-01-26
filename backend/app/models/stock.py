"""
종목 마스터 데이터 모델
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from backend.app.db.base import Base


class Stock(Base):
    """국내주식 종목 마스터"""
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False, comment="종목코드 (6자리)")
    name = Column(String(100), nullable=False, comment="종목명")
    market = Column(String(20), nullable=False, comment="시장구분 (KOSPI/KOSDAQ)")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="생성일시")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="수정일시")

    def __repr__(self):
        return f"<Stock(code={self.code}, name={self.name}, market={self.market})>"
