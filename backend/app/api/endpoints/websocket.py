
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models import Account
from backend.app.core.websocket_manager import manager
from backend.app.core.kis_client import KisClient
import logging

router = APIRouter()
logger = logging.getLogger("websocket_endpoint")

@router.websocket("/orders/{account_id}")
async def websocket_orders(websocket: WebSocket, account_id: int, db: Session = Depends(get_db)):
    await manager.connect_client(websocket)
    try:
        # Get Account
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            await websocket.send_json({"error": "Account not found"})
            await manager.disconnect_client(websocket)
            return

        # Ensure KIS Connection
        if not manager.is_connected:
            try:
                # 1. Get Approval Key
                approval_key = KisClient.get_approval_key(account, db)
                # 2. Connect to KIS
                await manager.connect(approval_key)
            except Exception as e:
                logger.error(f"Failed to initialize KIS WS: {e}")
                await websocket.send_json({"error": f"Failed to connect KIS: {str(e)}"})
                # We don't disconnect client immediately, maybe retry? 
                # But for now, allow connection but warn.
        
        # Subscribe to Executions if HTS ID exists
        if account.hts_id:
            await manager.subscribe_execution(account, account.hts_id)
        else:
            await websocket.send_json({"warning": "No HTS ID found. Real-time execution updates disabled."})
            logger.warning(f"Account {account_id} has no HTS ID")

        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Handle client messages if any (e.g. ping)
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        manager.disconnect_client(websocket)
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        manager.disconnect_client(websocket)

from pydantic import BaseModel
from typing import List

class SubscriptionRequest(BaseModel):
    codes: List[str]

@router.post("/subscribe")
async def subscribe_stocks(req: SubscriptionRequest):
    """Subscribe to real-time price updates for a list of stocks."""
    if not req.codes:
        return {"message": "No codes provided"}
    
    for code in req.codes:
        # Ignore CASH or invalid codes
        if code == "CASH" or not code:
            continue
        await manager.subscribe_stock_price(code)
    
    return {"message": f"Subscribed to {len(req.codes)} stocks"}
