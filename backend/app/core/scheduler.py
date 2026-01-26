from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal
from backend.app.models import ScheduledOrder, Account, TradeLog
from backend.app.core.kis_client import KisClient
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

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
                # Check remaining qty
                remaining_qty = order.total_quantity - order.executed_quantity
                if remaining_qty <= 0:
                    order.status = "COMPLETED"
                    continue
                
                # Determine qty for today
                qty_to_order = min(order.daily_quantity, remaining_qty)
                
                logger.info(f"Executing Scheduled Order #{order.id}: {order.stock_name} {qty_to_order} shares ({order.action})")
                
                # Execute Trade
                price_data = KisClient.get_price(order.account, db, order.stock_code)
                current_price = int(price_data['output']['stck_prpr'])
                
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

def start_scheduler():
    # 1. Update: Sell orders at 12:15 PM
    scheduler.add_job(execute_orders_by_action, 'cron', args=['SELL'], hour=12, minute=15, id='daily_sell_job')
    
    # 2. Update: Buy orders at 12:30 PM
    scheduler.add_job(execute_orders_by_action, 'cron', args=['BUY'], hour=12, minute=30, id='daily_buy_job')
    
    logger.info("Scheduler started with jobs: Sell(12:15), Buy(12:30)")
    scheduler.start()
