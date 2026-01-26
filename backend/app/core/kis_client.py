import requests
import time
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.core.config import get_base_url
from backend.app.core.auth_manager import AuthManager
from backend.app.models import Account
from backend.app.core.security import decrypt_data

class KisClient:
    """
    KIS API Proxy Client.
    Handles Auth injection and API requests for Real mode.
    """
    
    @staticmethod
    def _get_headers(account: Account, db: Session, tr_id: str = None) -> Dict[str, str]:
        token = AuthManager.get_token(account, db)
        app_key = decrypt_data(account.app_key)
        app_secret = decrypt_data(account.app_secret)
        
        headers = {
            "Content-Type": "application/json",
            "authorization": f"Bearer {token}",
            "appkey": app_key,
            "appsecret": app_secret,
            "tr_id": tr_id or "",
            "custtype": "P"
        }
        return headers

    @classmethod
    def get_balance(cls, account: Account, db: Session) -> Dict[str, Any]:
        """
        Get Account Balance (Stock Balance).
        Using TT840003R (Standard Stock Balance API).
        """
        time.sleep(0.1)
        url = f"{get_base_url()}/uapi/domestic-stock/v1/trading/inquire-balance"
        tr_id = "TTTC8434R" 
        
        headers = cls._get_headers(account, db, tr_id=tr_id)
        cano_decrypted = decrypt_data(account.cano)
        
        params = {
            "CANO": cano_decrypted,
            "ACNT_PRDT_CD": account.acnt_prdt_cd,
            "AFHR_FLPR_YN": "N",
            "OFL_YN": "N",
            "INQR_DVSN": "02",
            "UNPR_DVSN": "01",
            "FUND_STTL_ICLD_YN": "N",
            "FNCG_AMT_AUTO_RDPT_YN": "N",
            "PRCS_DVSN": "00",
            "CTX_AREA_FK100": "",
            "CTX_AREA_NK100": ""
        }

        try:
            res = requests.get(url, headers=headers, params=params)
            res.raise_for_status()
            data = res.json()
            if data.get("rt_cd") != "0":
                error_msg = f"KIS Error: {data.get('msg1')} ({data.get('msg_cd')})"
                raise ValueError(error_msg)
            
            return data
        except Exception as e:
            print(f"[KisClient] Error fetching balance: {e}")
            raise e

    @classmethod
    def get_price(cls, account: Account, db: Session, ticker: str) -> Dict[str, Any]:
        """
        Get Current Price for a ticker.
        """
        time.sleep(0.1)
        url = f"{get_base_url()}/uapi/domestic-stock/v1/quotations/inquire-price"
        tr_id = "FHKST01010100"
        
        headers = cls._get_headers(account, db, tr_id=tr_id)
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",
            "FID_INPUT_ISCD": ticker
        }
        
        try:
            res = requests.get(url, headers=headers, params=params)
            res.raise_for_status()
            return res.json()
        except Exception as e:
            print(f"[KisClient] Error fetching price for {ticker}: {e}")
            raise e

    @classmethod
    def place_order(cls, account: Account, db: Session, ticker: str, quantity: int, price: float, action: str) -> Dict[str, Any]:
        """
        Place Order.
        """
        time.sleep(0.2) 
        url = f"{get_base_url()}/uapi/domestic-stock/v1/trading/order-cash"
        
        is_buy = action.upper() == "BUY"
        tr_id = "TT840301U" if is_buy else "TT840302U"

        headers = cls._get_headers(account, db, tr_id=tr_id)
        cano_decrypted = decrypt_data(account.cano)

        payload = {
            "CANO": cano_decrypted,
            "ACNT_PRDT_CD": account.acnt_prdt_cd,
            "PDNO": ticker,
            "ORD_DVSN": "00", 
            "ORD_QTY": str(quantity),
            "ORD_UNPR": str(int(price)),
        }
        
        try:
            res = requests.post(url, headers=headers, json=payload)
            res.raise_for_status()
            return res.json()
        except Exception as e:
            print(f"[KisClient] Error placing order: {e}")
            raise e
