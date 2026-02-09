from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal
from backend.app.models import ScheduledOrder, Account, TradeLog
from backend.app.core.kis_client import KisClient
from datetime import datetime
from backend.app.services.sheet_sync_service import SheetSyncService
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

from pytz import timezone

scheduler = BackgroundScheduler(timezone=timezone('Asia/Seoul'))
job_history = {} # Key: job_id, Value: {last_run, status, message}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_orders_by_action(action_type: str):
    """
    Execute active scheduled orders filtered by action type.
    action_type: "BUY" or "SELL"
    """
    logger.info(f"Starting Scheduled Orders Execution for {action_type}...")
    db = SessionLocal()
    try:
        # Fetch ACTIVE orders for specific action
        active_orders = db.query(ScheduledOrder).filter(
            ScheduledOrder.status == "ACTIVE",
            ScheduledOrder.action == action_type
        ).all()
        
        for order in active_orders:
            try:
                # Check remaining qty/amount
                remaining_qty = 0
                remaining_amount = 0
                
                if order.order_mode == "AMOUNT":
                    remaining_amount = order.total_amount - order.executed_amount
                    if remaining_amount <= 0:
                        order.status = "COMPLETED"
                        continue
                else:
                    # Default QUANTITY mode
                    remaining_qty = order.total_quantity - order.executed_quantity
                    if remaining_qty <= 0:
                        order.status = "COMPLETED"
                        continue
                
                # Determine qty for today
                qty_to_order = 0
                target_daily_amt = 0
                
                # Get Current Price first to calculate quantity for Amount mode
                price_data = KisClient.get_price(order.account, db, order.stock_code)
                current_price = int(price_data['output']['stck_prpr'])

                if order.order_mode == "AMOUNT":
                    # Calculate quantity based on daily amount
                    # Use min of daily_amount or remaining_amount
                    target_daily_amt = min(order.daily_amount, remaining_amount)
                    if current_price > 0:
                        qty_to_order = int(target_daily_amt / current_price)
                        # If calculated qty is 0 (price > daily_amount), we might skip or force 1? 
                        # For now, let's skip if 0.
                        if qty_to_order == 0:
                            logger.info(f"Skipping Order #{order.id}: Price {current_price} > Target Amount {target_daily_amt}")
                            continue
                else:
                    qty_to_order = min(order.daily_quantity, remaining_qty)
                
                logger.info(f"Executing Scheduled Order #{order.id}: {order.stock_name} {qty_to_order} shares ({order.action}) Mode: {order.order_mode}")
                
                # Execute Trade (Price is already fetched)
                # ... reuse fetched price or let place_order fetch it? 
                # Optimization: Pass current_price to place_order if possible, but place_order might re-fetch.
                # Let's call place_order. 
                
                res = KisClient.place_order(
                    account=order.account,
                    db=db,
                    ticker=order.stock_code,
                    quantity=qty_to_order,
                    price=current_price,
                    action=order.action
                )
                
                if res.get('rt_cd') == "0":
                    # success
                    if order.order_mode == "AMOUNT":
                        order.executed_amount += (qty_to_order * current_price)
                        if order.executed_amount >= order.total_amount:
                             order.status = "COMPLETED"
                        # Also check if we should complete based on "Cannot buy more" logic?
                        # For now, simplistic check.
                    else:
                        order.executed_quantity += qty_to_order
                        if order.executed_quantity >= order.total_quantity:
                            order.status = "COMPLETED"
                    
                    # Log
                    log = TradeLog(
                        account_id=order.account_id,
                        strategy_id=f"scheduled_{order.id}",
                        ticker=order.stock_code,
                        action=order.action,
                        price=current_price,
                        quantity=qty_to_order,
                        status="SUCCESS",
                        message=res.get('msg1', 'Scheduled Execution')
                    )
                    db.add(log)
                else:
                    logger.error(f"Failed to execute order #{order.id}: {res.get('msg1')}")
                    # Log Failure
                    log = TradeLog(
                        account_id=order.account_id,
                        strategy_id=f"scheduled_{order.id}",
                        ticker=order.stock_code,
                        action=order.action,
                        price=current_price,
                        quantity=qty_to_order,
                        status="FAILED",
                        message=res.get('msg1', 'Unknown Error')
                    )
                    db.add(log)

            except Exception as e:
                logger.error(f"Error processing order #{order.id}: {e}")
        
        db.commit()
    except Exception as e:
        logger.error(f"Scheduler Error ({action_type}): {e}")
    finally:
        db.close()
    logger.info(f"Scheduled Orders Execution for {action_type} Finished.")

def scheduled_token_refresh():
    """
    Background job to refresh tokens if they are close to expiration.
    """
    logger.info("[Scheduler] Checking for expiring tokens...")
    db = SessionLocal()
    try:
        from backend.app.core.auth_manager import AuthManager
        AuthManager.check_and_refresh_all_accounts(db)
    except Exception as e:
        logger.error(f"[Scheduler] Token refresh failed: {e}")
    finally:
        db.close()

def record_daily_asset_job():
    """
    Daily job to record the total asset value for all accounts.
    """
    logger.info("[Scheduler] Starting Daily Asset Recording...")
    db = SessionLocal()
    try:
        from backend.app.models.daily_asset import DailyAssetHistory
        
        accounts = db.query(Account).all()
        for account in accounts:
            try:
                # Fetch Balance
                balance_data = KisClient.get_balance(account, db)
                output2 = balance_data.get("output2", [])
                if not output2:
                    logger.warning(f"[Scheduler] No balance data for account {account.alias}")
                    continue
                
                summary = output2[0]
                
                # Parse Values
                total_asset = int(summary.get("tot_evlu_amt", "0"))
                stock_eval = int(summary.get("scts_evlu_amt", "0")) # 주식 평가 금액
                cash_balance = int(summary.get("dnca_tot_amt", "0")) # 예수금
                total_pl = int(summary.get("evlu_pfls_smtl_amt", "0")) # 평가손익합계
                
                # Calculate Profit Rate (Cumulative)
                total_purchase = int(summary.get("pchs_amt_smtl_amt", "0"))
                if total_purchase > 0:
                    total_pl_rate = (total_pl / total_purchase) * 100
                    total_pl_rate = round(total_pl_rate, 2)
                else:
                    total_pl_rate = 0.0

                # Calculate Daily Metrics
                daily_pl = 0
                daily_rate = 0.0
                
                # Find previous record (Yesterday or latest before today)
                last_history = db.query(DailyAssetHistory).filter(
                    DailyAssetHistory.account_id == account.id,
                    DailyAssetHistory.date < datetime.now().date()
                ).order_by(DailyAssetHistory.date.desc()).first()
                
                if last_history:
                    # Daily P/L = Today Total P/L - Yesterday Total P/L
                    # This isolates the P/L change from deposits (assuming Total P/L is accurate from broker)
                    daily_pl = total_pl - last_history.total_profit_loss
                    
                    # Daily Rate = Daily P/L / Yesterday Total Asset
                    if last_history.total_asset_amount > 0:
                        daily_rate = (daily_pl / last_history.total_asset_amount) * 100
                        daily_rate = round(daily_rate, 2)
                
                # Create Record
                record = DailyAssetHistory(
                    account_id=account.id,
                    date=datetime.now().date(),
                    total_asset_amount=total_asset,
                    stock_eval_amount=stock_eval,
                    cash_balance=cash_balance,
                    total_profit_loss=total_pl,
                    total_profit_rate=total_pl_rate,
                    daily_profit_loss=daily_pl,
                    daily_profit_rate=daily_rate
                )
                db.add(record)
                logger.info(f"[Scheduler] Recorded asset for {account.alias}: {total_asset:,} KRW")
                
            except Exception as e:
                logger.error(f"[Scheduler] Failed to record asset for {account.alias}: {e}")
        
        db.commit()
        
    except Exception as e:
        logger.error(f"[Scheduler] Daily Asset Recording Failed: {e}")
    finally:
        db.close()

def sync_google_sheet_job():
    """
    Job to sync investment list to Google Sheets
    """
    logger.info("[Scheduler] Starting Google Sheet Sync Job...")
    db = SessionLocal()
    try:
        SheetSyncService.sync_daily_data(db)
    except Exception as e:
        logger.error(f"[Scheduler] Google Sheet Sync Failed: {e}")
    finally:
        db.close()

def start_scheduler():
    from backend.app.core.config import settings
    print(f"[Scheduler] Starting scheduler... Enabled={settings.SCHEDULER_ENABLED}")
    if not settings.SCHEDULER_ENABLED:
        logger.info("[Scheduler] Scheduler is DISABLED by configuration.")
        print("[Scheduler] Scheduler is DISABLED by configuration.")
        return

    # 1. Update: Sell orders at 12:15 PM
    scheduler.add_job(execute_orders_by_action, 'cron', args=['SELL'], hour=12, minute=15, id='daily_sell_job')
    
    # 2. Update: Buy orders at 12:30 PM
    scheduler.add_job(execute_orders_by_action, 'cron', args=['BUY'], hour=12, minute=30, id='daily_buy_job')
    
    # 3. Token Refresh: Every hour
    scheduler.add_job(scheduled_token_refresh, 'interval', minutes=60, id='hourly_token_refresh')
    
    # 4. Daily Asset Recording: Daily at 4:00 PM
    scheduler.add_job(record_daily_asset_job, 'cron', hour=16, minute=0, id='daily_asset_recording')

    # 5. Google Sheet Sync: Daily at 4:30 PM (Production Only)
    if settings.APP_ENV == "prd":
        scheduler.add_job(sync_google_sheet_job, 'cron', hour=16, minute=30, id='google_sheet_sync')
        logger.info("[Scheduler] Registered Google Sheet Sync Job (PRD Mode)")
    else:
        logger.info("[Scheduler] Skipped Google Sheet Sync Job (Not PRD)")
    
    logger.info(f"Scheduler started. APP_ENV={settings.APP_ENV}")
    print(f"[Scheduler] Scheduler started. APP_ENV={settings.APP_ENV}")

    # Add Listener to track job history
    from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
    def save_job_history(event):
        job_id = event.job_id
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        status = "SUCCESS" if not event.exception else "FAILED"
        job_history[job_id] = {
            "last_run": timestamp,
            "status": status,
            "message": str(event.exception) if event.exception else "Success"
        }
        logger.info(f"[Scheduler] Job {job_id} finished. Status: {status}")

    scheduler.add_listener(save_job_history, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)
    scheduler.start()
