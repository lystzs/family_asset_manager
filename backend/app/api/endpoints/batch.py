from fastapi import APIRouter, HTTPException, BackgroundTasks
from backend.app.core import scheduler
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Map job job_ids to their actual functions
BATCH_JOBS = {
    # "stock_master_sync": scheduler.sync_stock_master_job, # core/scheduler.py doesn't have this yet, keep disabled or implement?
    # tick is also missing in core/scheduler.py
    "token_refresh": scheduler.scheduled_token_refresh,
    "asset_recording": scheduler.record_daily_asset_job,
    "daily_buy": lambda: scheduler.execute_orders_by_action("BUY"),
    "daily_sell": lambda: scheduler.execute_orders_by_action("SELL"),
    "google_sheet_sync": scheduler.sync_google_sheet_job
}

@router.get("/jobs")
def get_available_jobs():
    """
    Get list of available batch jobs
    """
    return [
        {"id": "asset_recording", "name": "자산 변동 내역 기록", "description": "모든 계좌의 현재 자산을 기록합니다. (매일 16:00 자동실행)"},
        {"id": "token_refresh", "name": "토큰 강제 갱신", "description": "1시간 내 만료 예정인 토큰을 확인하고 갱신합니다."},
        {"id": "daily_buy", "name": "일간 매수 주문 실행", "description": "예약된 매수 주문을 실행합니다. (매일 12:30 자동실행)"},
        {"id": "daily_sell", "name": "일간 매도 주문 실행", "description": "예약된 매도 주문을 실행합니다. (매일 12:15 자동실행)"},
        {"id": "google_sheet_sync", "name": "구글 시트 동기화", "description": "투자 내역을 구글 시트로 동기화합니다. (매일 16:30 자동실행)"},
    ]

@router.post("/exec/{job_id}")
async def execute_batch_job(job_id: str, background_tasks: BackgroundTasks):
    """
    Manually trigger a batch job
    """
    if job_id not in BATCH_JOBS:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    job_func = BATCH_JOBS[job_id]
    
    # Run in background
    background_tasks.add_task(job_func)
    
    logger.info(f"Manual trigger for job: {job_id}")
    return {"message": f"Job {job_id} started in background"}
