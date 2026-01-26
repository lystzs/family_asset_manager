from apscheduler.schedulers.background import BackgroundScheduler
import time
import logging

logger = logging.getLogger(__name__)

def tick():
    print(f"[Scheduler] Tick: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    # Here we can add AuthManager.refresh_token() or Data Collection logic

def sync_stock_master_job():
    """종목 마스터 동기화 작업"""
    logger.info("[Scheduler] Starting weekly stock master sync...")
    try:
        from backend.app.services.stock_master import StockMasterService
        result = StockMasterService.sync_stock_master()
        logger.info(f"[Scheduler] Stock master sync completed: {result}")
    except Exception as e:
        logger.error(f"[Scheduler] Stock master sync failed: {e}", exc_info=True)

scheduler = BackgroundScheduler()

def start_scheduler():
    # Job 1: Simple Tick every 1 minute
    scheduler.add_job(tick, 'interval', seconds=60)
    
    # Job 2: Stock Master Sync (Every Sunday at 2 AM)
    scheduler.add_job(
        sync_stock_master_job,
        'cron',
        day_of_week='sun',  # 일요일
        hour=2,             # 오전 2시
        minute=0,
        id='stock_master_sync',
        name='주간 종목 마스터 동기화',
        replace_existing=True
    )
    
    # Job 3: Auth Refresh (Example: run every hour)
    # scheduler.add_job(AuthManager.refresh_token, 'interval', minutes=50)
    
    scheduler.start()
    print("[Scheduler] Started.")
    logger.info("[Scheduler] Scheduled jobs:")
    logger.info("  - Tick: Every 1 minute")
    logger.info("  - Stock Master Sync: Every Sunday at 2:00 AM")
