
import asyncio
import json
import logging
import websockets
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from backend.app.core.kis_client import KisClient
from backend.app.models import Account
from backend.app.core.security import decrypt_data

logger = logging.getLogger("websocket_manager")
logger.setLevel(logging.INFO)

# KIS WebSocket Endpoint (Real) - Ops
KIS_WS_URL = "ws://ops.koreainvestment.com:21000"

class WebSocketManager:
    """
    Manages WebSocket connection to KIS and broadcasts to Frontend clients.
    """
    def __init__(self):
        self.active_connections: List[websockets.WebSocketServerProtocol] = []
        self.kis_ws = None
        self.approval_key = None
        self.is_connected = False
        self.account_subscriptions: Dict[str, Account] = {} # hts_id -> Account

    async def connect(self, approval_key: str):
        """Connect to KIS WebSocket"""
        self.approval_key = approval_key
        try:
            self.kis_ws = await websockets.connect(f"{KIS_WS_URL}/tryitout/H0STCN0")
            self.is_connected = True
            logger.info("Connected to KIS WebSocket")
            asyncio.create_task(self.listen_kis())
        except Exception as e:
            logger.error(f"Failed to connect KIS WS: {e}")
            self.is_connected = False

    async def subscribe_execution(self, account: Account, hts_id: str):
        """Subscribe to Execution Notification (H0STCNI0)"""
        if not self.is_connected or not self.kis_ws:
            logger.error("KIS WS not connected")
            return

        self.account_subscriptions[hts_id] = account
        
        req = {
            "header": {
                "approval_key": self.approval_key,
                "custtype": "P",
                "tr_type": "1", # Register
                "content-type": "utf-8"
            },
            "body": {
                "input": {
                    "tr_id": "H0STCNI0", # Real Environment
                    "tr_key": hts_id
                }
            }
        }
        
        await self.kis_ws.send(json.dumps(req))
        logger.info(f"Subscribed to execution for HTS ID: {hts_id}")

    async def subscribe_stock_price(self, stock_code: str):
        """Subscribe to Real-time Stock Price (H0STCNT0)"""
        if not self.is_connected or not self.kis_ws:
            logger.error("KIS WS not connected")
            return

        req = {
            "header": {
                "approval_key": self.approval_key,
                "custtype": "P",
                "tr_type": "1", # Register
                "content-type": "utf-8"
            },
            "body": {
                "input": {
                    "tr_id": "H0STCNT0", # Real-time Price
                    "tr_key": stock_code
                }
            }
        }
        
        await self.kis_ws.send(json.dumps(req))
        logger.info(f"Subscribed to price for Stock: {stock_code}")

    async def listen_kis(self):
        """Listen to KIS messages, decrypt, and broadcast"""
        try:
            while self.is_connected:
                msg = await self.kis_ws.recv()
                
                text_msg = str(msg)
                if not text_msg: continue
                
                first_char = text_msg[0]
                
                if first_char == '0' or first_char == '1':
                    parts = text_msg.split('|')
                    if len(parts) >= 4:
                        encrypted = parts[0] == '1'
                        tr_id = parts[1]
                        data_cnt = parts[2]
                        payload = parts[3] # Verified data separated by ^

                        if encrypted:
                            # AES256 Decrypt (Skipped for now)
                            pass
                        
                        if tr_id == "H0STCNI0": # Execution
                            logger.info(f"KIS MSG ({tr_id}): {payload[:50]}...")
                            await self.broadcast({"type": "EXECUTION", "data": "Refresh Required"})
                            
                        elif tr_id == "H0STCNT0": # Real-time Price
                            # Payload format: MKSC_SHRN_ISCD^STCK_CNTG_HOUR^STCK_PRPR^... 
                            # 0: Code, 1: Time, 2: Price, ...
                            data_parts = payload.split('^')
                            if len(data_parts) > 10:
                                stock_code = data_parts[0]
                                current_price = data_parts[2]
                                price_change = data_parts[4] # prdy_vrss
                                change_rate = data_parts[5] # prdy_ctrt
                                
                                await self.broadcast({
                                    "type": "PRICE",
                                    "code": stock_code,
                                    "price": current_price,
                                    "change": price_change,
                                    "rate": change_rate
                                })
                        
                else:
                    # Json message (ping/pong or sub response)
                    try:
                        data = json.loads(text_msg)
                        logger.info(f"KIS JSON: {data}")
                    except:
                        pass
                        
        except Exception as e:
            logger.error(f"KIS Listen Error: {e}")
            self.is_connected = False

    # Frontend Connection Manager
    async def connect_client(self, websocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect_client(self, websocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = WebSocketManager()
