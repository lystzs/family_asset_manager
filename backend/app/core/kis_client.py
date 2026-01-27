import requests
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List
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
            "content-type": "application/json",
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
            
            # Enrich with real-time price data in parallel
            holdings = data.get("output1", [])
            
            def enrich_holding(holding):
                ticker = holding.get("pdno")
                if not ticker: return
                try:
                    price_data = cls.get_price(account, db, ticker)
                    output = price_data.get("output", {})
                    if output:
                        holding["prdy_vrss"] = output.get("prdy_vrss")
                        holding["prdy_ctrt"] = output.get("prdy_ctrt")
                        holding["prpr"] = output.get("stck_prpr")
                except Exception as e:
                    print(f"[KisClient] Failed to enrich {ticker}: {e}")

            if holdings:
                with ThreadPoolExecutor(max_workers=min(len(holdings), 10)) as executor:
                    executor.map(enrich_holding, holdings)
            
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

    @staticmethod
    def _get_hashkey(account: Account, payload: Dict[str, Any]) -> str:
        """
        Generate Hashkey for POST requests.
        """
        url = f"{get_base_url()}/uapi/hashkey"
        app_key = decrypt_data(account.app_key)
        app_secret = decrypt_data(account.app_secret)
        
        headers = {
            "content-type": "application/json",
            "appkey": app_key,
            "appsecret": app_secret
        }
        
        try:
            res = requests.post(url, headers=headers, json=payload)
            res.raise_for_status()
            data = res.json()
            return data["HASH"]
        except Exception as e:
            print(f"[KisClient] Error generating hashkey: {e}")
            raise e

    @classmethod
    def place_order(cls, account: Account, db: Session, ticker: str, quantity: int, price: float, action: str, ord_dvsn: str = "00") -> Dict[str, Any]:
        """
        Place Order.
        ord_dvsn: "00" (Limit), "01" (Market), etc.
        """
        time.sleep(0.2) 
        url = f"{get_base_url()}/uapi/domestic-stock/v1/trading/order-cash"
        
        is_buy = action.upper() == "BUY"
        tr_id = "TTTC0802U" if is_buy else "TTTC0801U"

        # Headers will be updated with hashkey later
        headers = cls._get_headers(account, db, tr_id=tr_id)
        cano_decrypted = decrypt_data(account.cano)

        # If Market Order, Price must be "0"
        final_price = str(int(price))
        if ord_dvsn == "01":
            final_price = "0"

        payload = {
            "CANO": cano_decrypted,
            "ACNT_PRDT_CD": account.acnt_prdt_cd,
            "PDNO": ticker,
            "ORD_DVSN": ord_dvsn, 
            "ORD_QTY": str(quantity),
            "ORD_UNPR": final_price,
        }
        
        # Security: Get Hashkey for POST payload
        try:
            hashkey = cls._get_hashkey(account, payload)
            headers["hashkey"] = hashkey
        except Exception as e:
            print(f"Failed to generate Hashkey: {e}")
            # Try proceeding without it? No, likely fail.
            raise e

        try:
            res = requests.post(url, headers=headers, json=payload)
            res.raise_for_status()
            data = res.json()
            if data.get("rt_cd") != "0":
                error_msg = f"KIS Error: {data.get('msg1')} ({data.get('msg_cd')})"
                print(f"[KisClient] {error_msg}")
                raise ValueError(error_msg)
            return data
        except Exception as e:
            if hasattr(e, 'response') and e.response is not None:
                try:
                    err_data = e.response.json()
                    err_msg = err_data.get('msg1') or err_data.get('message') or e.response.text
                    err_code = err_data.get('msg_cd') or err_data.get('code')
                    detailed_msg = f"KIS Failed: {err_msg} ({err_code})"
                    print(f"[KisClient] Error placing order: {detailed_msg}")
                    raise ValueError(detailed_msg) from e
                except:
                    status_code = e.response.status_code if hasattr(e, "response") else "Unknown"
                    resp_text = e.response.text or e.response.reason or str(e)
                    print(f"[KisClient] Error placing order: Status {status_code}. Response: {resp_text}")
                    raise ValueError(f"KIS HTTP Error ({status_code}): {resp_text}") from e
            else:
                print(f"[KisClient] Error placing order: {e}")
                raise e

    @classmethod
    def get_unfilled_orders(cls, account: Account, db: Session) -> Dict[str, Any]:
        """
        Get Unfilled Orders (inquire-psbl-rvsecncl).
        """
        time.sleep(0.1)
        url = f"{get_base_url()}/uapi/domestic-stock/v1/trading/inquire-psbl-rvsecncl"
        tr_id = "TTTC0084R"
        
        headers = cls._get_headers(account, db, tr_id=tr_id)
        cano_decrypted = decrypt_data(account.cano)
        
        params = {
            "CANO": cano_decrypted,
            "ACNT_PRDT_CD": account.acnt_prdt_cd,
            "CTX_AREA_FK100": "",
            "CTX_AREA_NK100": "",
            "INQR_DVSN_1": "1", # Changed to 1:Stock Order Seq for Unfilled
            "INQR_DVSN_2": "0", # 0:All, 1:Sell, 2:Buy
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
            if hasattr(e, 'response') and e.response is not None:
                try:
                    err_data = e.response.json()
                    err_msg = err_data.get('msg1') or err_data.get('message') or e.response.text
                    err_code = err_data.get('msg_cd') or err_data.get('code')
                    detailed_msg = f"KIS Failed: {err_msg} ({err_code})"
                    print(f"[KisClient] Error fetching unfilled orders: {detailed_msg}")
                    raise ValueError(detailed_msg) from e
                except:
                    print(f"[KisClient] Error fetching unfilled orders: {e}. Response: {e.response.text}")
                    raise ValueError(f"KIS HTTP Error: {e.response.text}") from e
            else:
                print(f"[KisClient] Error fetching unfilled orders: {e}")
                raise e

    @classmethod
    def get_executed_orders(cls, account: Account, db: Session) -> Dict[str, Any]:
        """
        Get Daily Execution History (TTTC8001R).
        """
        time.sleep(0.1)
        url = f"{get_base_url()}/uapi/domestic-stock/v1/trading/inquire-daily-ccld"
        tr_id = "TTTC8001R"
        
        headers = cls._get_headers(account, db, tr_id=tr_id)
        cano_decrypted = decrypt_data(account.cano)
        
        today = datetime.now().strftime("%Y%m%d")
        
        params = {
            "CANO": cano_decrypted,
            "ACNT_PRDT_CD": account.acnt_prdt_cd,
            "INQR_STRT_DT": today,
            "INQR_END_DT": today,
            "SLL_BUY_DVSN_CD": "00", # 00:All, 01:Sell, 02:Buy
            "INQR_DVSN": "00",       # 00:Descending, 01:Ascending - This was previously "01" (Executed) but specs say 00/01 is sort order? 
                                     # Wait, example says inqr_dvsn: "00" (Reverse), "01" (Forward). 
                                     # BUT my previous code used "01" for "Executed vs Unfilled"? 
                                     # Let's check the example:
                                     # ccld_dvsn: "00"(All), "01"(Executed), "02"(Unfilled)
            "CCLD_DVSN": "01",       # 01:Executed Only (since we want executed orders)
            "ORD_GNO_BRNO": "",      # Branch Number
            "ODNO": "",              # Order Number
            "PDNO": "",              # Product Number (Added back)
            "INQR_DVSN_3": "00",     # 00:All, 01:Cash, etc.
            "INQR_DVSN_1": "",       # "" : All, 1:ELW, 2:Freeboard
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
            if hasattr(e, 'response') and e.response is not None:
                try:
                    err_data = e.response.json()
                    err_msg = err_data.get('msg1') or err_data.get('message') or e.response.text
                    err_code = err_data.get('msg_cd') or err_data.get('code')
                    detailed_msg = f"KIS Failed: {err_msg} ({err_code})"
                    print(f"[KisClient] Error fetching executed orders: {detailed_msg}")
                    raise ValueError(detailed_msg) from e
                except:
                    print(f"[KisClient] Error fetching executed orders: {e}. Response: {e.response.text}")
                    raise ValueError(f"KIS HTTP Error: {e.response.text}") from e
            else:
                print(f"[KisClient] Error fetching executed orders: {e}")
                raise e

    @classmethod
    def revise_cancel_order(cls, account: Account, db: Session, orgn_odno: str, revision_type: str, quantity: int, price: float, ord_dvsn: str = "00", all_qty: bool = True) -> Dict[str, Any]:
        """
        Revise or Cancel Order (TTTC0803U).
        orgn_odno: Original Order Number
        revision_type: "01" (Change), "02" (Cancel)
        quantity: New Quantity
        price: New Price (0 for market)
        ord_dvsn: "00" (Limit), "01" (Market), etc.
        """
        time.sleep(0.2)
        url = f"{get_base_url()}/uapi/domestic-stock/v1/trading/order-rvsecncl"
        tr_id = "TTTC0803U"

        headers = cls._get_headers(account, db, tr_id=tr_id)
        cano_decrypted = decrypt_data(account.cano)

        final_price = str(int(price))
        if ord_dvsn == "01":
            final_price = "0"

        # For cancellation (02), both qty and price should be "0" if we cancel all remaining
        is_cancel = revision_type == "02"

        payload = {
            "CANO": cano_decrypted,
            "ACNT_PRDT_CD": account.acnt_prdt_cd,
            "KRX_FWDG_ORD_ORGNO": " ", 
            "ORGN_ODNO": orgn_odno,
            "RVSE_CNCL_DVSN_CD": revision_type,
            "ORD_DVSN": ord_dvsn,
            "ORD_QTY": "0" if (is_cancel and all_qty) else str(quantity),
            "ORD_UNPR": "0" if (is_cancel and all_qty) else final_price,
            "QTY_ALL_ORD_YN": "Y" if all_qty else "N" 
        }

        try:
            hashkey = cls._get_hashkey(account, payload)
            headers["hashkey"] = hashkey
        except Exception as e:
            print(f"Failed to generate Hashkey: {e}")
            raise e

        try:
            res = requests.post(url, headers=headers, json=payload)
            res.raise_for_status()
            data = res.json()
            if data.get("rt_cd") != "0":
                error_msg = f"KIS Error: {data.get('msg1')} ({data.get('msg_cd')})"
                print(f"[KisClient] {error_msg}")
                raise ValueError(error_msg)
            return data
        except Exception as e:
            if hasattr(e, 'response') and e.response is not None:
                try:
                    err_data = e.response.json()
                    err_msg = err_data.get('msg1') or err_data.get('message') or e.response.text
                    err_code = err_data.get('msg_cd') or err_data.get('code')
                    detailed_msg = f"KIS Failed: {err_msg} ({err_code})"
                    print(f"[KisClient] Error revising/cancelling order: {detailed_msg}")
                    raise ValueError(detailed_msg) from e
                except:
                    status_code = e.response.status_code if hasattr(e, 'response') else "Unknown"
                    resp_text = e.response.text or e.response.reason or str(e)
                    print(f"[KisClient] Error revising/cancelling order: Status {status_code}. Response: {resp_text}")
                    raise ValueError(f"KIS HTTP Error ({status_code}): {resp_text}") from e
            else:
                print(f"[KisClient] Error revising/cancelling order: {e}")
                raise e

    @classmethod
    def get_approval_key(cls, account: Account, db: Session) -> str:
        """
        Get WebSocket Approval Key (POST /oauth2/Approval)
        """
        url = f"{get_base_url()}/oauth2/Approval"
        
        # Helper to decrypt
        def decrypt_data_local(encrypted_data):
            try:
                from backend.app.core.security import decrypt_data
                return decrypt_data(encrypted_data)
            except Exception as e:
                print(f"Decryption failed: {e}")
                return encrypted_data

        app_key = decrypt_data_local(account.app_key)
        app_secret = decrypt_data_local(account.app_secret)

        body = {
            "grant_type": "client_credentials",
            "appkey": app_key,
            "secretkey": app_secret
        }
        
        try:
            res = requests.post(url, json=body)
            res.raise_for_status()
            data = res.json()
            approval_key = data.get("approval_key")
            return approval_key
        except Exception as e:
            print(f"[KisClient] Failed to get approval key: {e}")
            raise e
