"""
국내주식 종목 마스터 관리 서비스
KIS 공식 마스터 파일을 사용하여 KOSPI/KOSDAQ 전체 종목 정보를 DB에 저장하고 관리합니다.
"""
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal
from backend.app.models.stock import Stock
import logging

logger = logging.getLogger(__name__)


class StockMasterService:
    """종목 마스터 관리 서비스 (DB 기반)"""
    
    @classmethod
    def sync_stock_master(cls) -> Dict[str, int]:
        """
        KRX에서 전체 종목 데이터를 가져와 DB에 동기화
        
        Returns:
            {"added": 10, "updated": 5, "total": 2500}
        """
        logger.info("Starting stock master sync...")
        
        db = SessionLocal()
        try:
            stocks_data = cls._fetch_from_krx()
            
            if not stocks_data:
                logger.warning("No data fetched from KRX, skipping sync")
                return {"added": 0, "updated": 0, "total": 0}
            
            added = 0
            updated = 0
            seen_codes = set() # 원본 데이터 내 중복 방지
            
            for stock_data in stocks_data:
                code = stock_data["code"]
                name = stock_data["name"]
                market = stock_data["market"]
                
                if code in seen_codes:
                    continue
                seen_codes.add(code)
                
                # DB에서 기존 종목 조회
                existing = db.query(Stock).filter(Stock.code == code).first()
                
                if existing:
                    # 업데이트 (이름이나 시장 변경된 경우)
                    if existing.name != name or existing.market != market:
                        existing.name = name
                        existing.market = market
                        updated += 1
                else:
                    # 신규 추가
                    new_stock = Stock(code=code, name=name, market=market)
                    db.add(new_stock)
                    added += 1
                
                # 대량 처리시 메모리 및 트랜잭션 관리
                if (added + updated) % 500 == 0:
                    db.commit()
            
            db.commit()
            total = db.query(Stock).count()
            
            logger.info(f"Stock master sync completed: added={added}, updated={updated}, total={total}")
            
            return {"added": added, "updated": updated, "total": total}
            
        except Exception as e:
            logger.error(f"Error syncing stock master: {e}", exc_info=True)
            db.rollback()
            return {"added": 0, "updated": 0, "total": 0}
        finally:
            db.close()
    
    @classmethod
    def _fetch_from_krx(cls) -> List[Dict[str, str]]:
        """KIS 공식 종목 마스터 파일에서 데이터 가져오기"""
        try:
            import urllib.request
            import ssl
            import zipfile
            import tempfile
            import pandas as pd
            
            logger.info("Downloading stock master files from KIS...")
            
            # SSL 설정
            ssl._create_default_https_context = ssl._create_unverified_context
            
            stocks = []
            
            with tempfile.TemporaryDirectory() as temp_dir:
                # KOSPI 다운로드 및 파싱
                try:
                    logger.info("Fetching KOSPI master...")
                    kospi_zip_path = f"{temp_dir}/kospi_code.zip"
                    urllib.request.urlretrieve(
                        "https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip",
                        kospi_zip_path
                    )
                    
                    with zipfile.ZipFile(kospi_zip_path) as z:
                        z.extractall(temp_dir)
                    
                    # KOSPI 파일 파싱
                    kospi_file = f"{temp_dir}/kospi_code.mst"
                    part1_data = []
                    
                    with open(kospi_file, mode="rb") as f:
                        for row in f:
                            if len(row) < 100:
                                continue
                            # KOSPI MST Layout:
                            # 0-9: 단축코드 (9 bytes). 보통 'A' + 6자리 코드. (예: 'A005930  ')
                            # 21-61: 종목명 (40 bytes)
                            full_code = row[0:9].decode('cp949', errors='ignore').strip()
                            # 'A'로 시작하면 그 뒤의 6자리를 종목코드로 사용 (예: A005930 -> 005930)
                            code = full_code[1:] if full_code.startswith('A') else full_code
                            name = row[21:61].decode('cp949', errors='ignore').strip()
                            
                            if code and name:
                                part1_data.append({"code": code, "name": name})
                    
                    for item in part1_data:
                        stocks.append({
                            "code": item["code"],
                            "name": item["name"],
                            "market": "KOSPI"
                        })
                    
                    logger.info(f"Loaded {len(part1_data)} KOSPI stocks")
                    
                except Exception as e:
                    logger.error(f"Failed to load KOSPI: {e}")
                
                # KOSDAQ 다운로드 및 파싱
                try:
                    logger.info("Fetching KOSDAQ master...")
                    kosdaq_zip_path = f"{temp_dir}/kosdaq_code.zip"
                    urllib.request.urlretrieve(
                        "https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip",
                        kosdaq_zip_path
                    )
                    
                    with zipfile.ZipFile(kosdaq_zip_path) as z:
                        z.extractall(temp_dir)
                    
                    # KOSDAQ 파일 파싱
                    kosdaq_file = f"{temp_dir}/kosdaq_code.mst"
                    part1_data = []
                    
                    with open(kosdaq_file, mode="rb") as f:
                        for row in f:
                            if len(row) < 100:
                                continue
                            # KOSDAQ MST Layout:
                            # 0-9: 단축코드 (9 bytes). 보통 'A' + 6자리 코드.
                            # 21-61: 종목명 (40 bytes)
                            full_code = row[0:9].decode('cp949', errors='ignore').strip()
                            code = full_code[1:] if full_code.startswith('A') else full_code
                            name = row[21:61].decode('cp949', errors='ignore').strip()
                            
                            if code and name:
                                part1_data.append({"code": code, "name": name})
                    
                    for item in part1_data:
                        stocks.append({
                            "code": item["code"],
                            "name": item["name"],
                            "market": "KOSDAQ"
                        })
                    
                    logger.info(f"Loaded {len(part1_data)} KOSDAQ stocks")
                    
                except Exception as e:
                    logger.error(f"Failed to load KOSDAQ: {e}")
            
            if len(stocks) == 0:
                logger.warning("KIS master files returned no data, using fallback")
                from backend.app.data.stock_master_data import STOCK_MASTER_DATA
                return STOCK_MASTER_DATA
            
            logger.info(f"Successfully fetched {len(stocks)} stocks from KIS master files")
            return stocks
            
        except Exception as e:
            logger.error(f"Error fetching from KIS: {e}", exc_info=True)
            from backend.app.data.stock_master_data import STOCK_MASTER_DATA
            return STOCK_MASTER_DATA
    
    @classmethod
    def get_all_stocks(cls) -> List[Dict[str, str]]:
        """
        DB에서 전체 종목 조회
        
        Returns:
            [{"code": "005930", "name": "삼성전자", "market": "KOSPI"}, ...]
        """
        db = SessionLocal()
        try:
            stocks = db.query(Stock).all()
            
            # DB에 데이터가 없으면 동기화 실행
            if not stocks:
                logger.info("No stocks in DB, running initial sync...")
                cls.sync_stock_master()
                stocks = db.query(Stock).all()
            
            return [
                {"code": s.code, "name": s.name, "market": s.market}
                for s in stocks
            ]
        finally:
            db.close()
    
    @classmethod
    def search_stocks(cls, keyword: str, limit: int = 50) -> List[Dict[str, str]]:
        """
        종목 검색 (종목명 또는 코드)
        
        Args:
            keyword: 검색 키워드
            limit: 최대 결과 개수
        """
        if not keyword:
            return cls.get_all_stocks()[:limit]
        
        db = SessionLocal()
        try:
            keyword_upper = keyword.upper()
            
            # 종목코드 또는 종목명에 키워드 포함
            stocks = db.query(Stock).filter(
                (Stock.code.like(f"%{keyword_upper}%")) |
                (Stock.name.like(f"%{keyword}%"))
            ).limit(limit).all()
            
            return [
                {"code": s.code, "name": s.name, "market": s.market}
                for s in stocks
            ]
        finally:
            db.close()
    
    @classmethod
    def get_stock_by_code(cls, code: str) -> Optional[Dict[str, str]]:
        """종목코드로 조회"""
        db = SessionLocal()
        try:
            stock_obj = db.query(Stock).filter(Stock.code == code).first()
            
            if stock_obj:
                return {
                    "code": stock_obj.code,
                    "name": stock_obj.name,
                    "market": stock_obj.market
                }
            return None
        finally:
            db.close()
    
    @classmethod
    def get_stock_count(cls) -> Dict[str, int]:
        """종목 통계"""
        db = SessionLocal()
        try:
            total = db.query(Stock).count()
            kospi = db.query(Stock).filter(Stock.market == "KOSPI").count()
            kosdaq = db.query(Stock).filter(Stock.market == "KOSDAQ").count()
            
            return {"total": total, "kospi": kospi, "kosdaq": kosdaq}
        finally:
            db.close()
