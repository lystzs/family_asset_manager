"""
국내주식 종목 마스터 관련 API 엔드포인트
"""
from fastapi import APIRouter, Query
from typing import List, Dict
from backend.app.services.stock_master import StockMasterService

router = APIRouter()


@router.get("/", response_model=List[Dict[str, str]])
def get_all_stocks():
    """
    전체 국내주식 종목 리스트 조회 (DB)
    
    - KOSPI + KOSDAQ 전체 종목 포함
    - DB에 데이터가 없으면 자동으로 초기 동기화 실행
    """
    return StockMasterService.get_all_stocks()


@router.get("/search", response_model=List[Dict[str, str]])
def search_stocks(
    q: str = Query(..., description="검색 키워드 (종목명 또는 코드)"),
    limit: int = Query(50, ge=1, le=200, description="최대 결과 개수")
):
    """
    종목 검색
    
    - **q**: 검색 키워드 (종목명 또는 종목코드)
    - **limit**: 최대 반환 개수 (기본 50개, 최대 200개)
    
    예시:
    - /stocks/search?q=삼성
    - /stocks/search?q=005930
    """
    return StockMasterService.search_stocks(keyword=q, limit=limit)


@router.get("/stats", response_model=Dict[str, int])
def get_stock_stats():
    """
    종목 통계 조회
    
    Returns:
        {"total": 2500, "kospi": 900, "kosdaq": 1600}
    """
    return StockMasterService.get_stock_count()


@router.get("/{code}", response_model=Dict[str, str])
def get_stock_by_code(code: str):
    """
    종목코드로 특정 종목 정보 조회
    
    - **code**: 6자리 종목코드
    
    예시: /stocks/005930
    """
    stock = StockMasterService.get_stock_by_code(code)
    if not stock:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Stock code {code} not found")
    return stock


@router.post("/sync")
def sync_stock_master():
    """
    종목 마스터 동기화 (수동 실행)
    
    KRX에서 최신 종목 데이터를 가져와 DB에 동기화합니다.
    일반적으로 매주 일요일 자동 실행되지만, 필요시 수동으로 실행할 수 있습니다.
    
    Returns:
        {"added": 10, "updated": 5, "total": 2500, "message": "Sync completed"}
    """
    result = StockMasterService.sync_stock_master()
    result["message"] = "Sync completed successfully"
    return result
