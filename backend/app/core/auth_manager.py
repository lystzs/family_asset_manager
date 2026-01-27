import requests
import time
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.core.config import settings, get_base_url
from backend.app.models import Account
from backend.app.core.security import decrypt_data, encrypt_data

class AuthManager:
    @classmethod
    def get_token(cls, account: Account, db: Session) -> str:
        """
        Get valid access token for the specific account.
        If expired or missing, refresh it synchronously and update DB.
        """
        if cls._is_token_valid(account):
            # Decrypt stored token
            return decrypt_data(account.access_token)
        
        return cls._refresh_token(account, db)
    
    @classmethod
    def _is_token_valid(cls, account: Account) -> bool:
        if not account.access_token or not account.token_expired_at:
            return False
        # Buffer 60 seconds
        return datetime.now() < (account.token_expired_at - timedelta(seconds=60))

    @classmethod
    def _refresh_token(cls, account: Account, db: Session) -> str:
        # Check if acting as Client (Proxy Mode)
        if settings.MASTER_API_URL:
            try:
                print(f"[Auth] Fetching token from Master: {settings.MASTER_API_URL}")
                sync_url = f"{settings.MASTER_API_URL}/v1/sync/kis-token/{account.account_number}"
                res = requests.get(sync_url, headers={"x-sync-key": settings.SYNC_API_KEY}, timeout=5)
                res.raise_for_status()
                data = res.json()
                
                new_token = data["access_token"]
                expired_at_str = data["expired_at"] # ISO format
                
                # Update Local DB
                account.access_token = encrypt_data(new_token)
                if expired_at_str:
                    account.token_expired_at = datetime.fromisoformat(expired_at_str)
                
                db.commit()
                db.refresh(account)
                return new_token
            except Exception as e:
                print(f"[Auth] Failed to sync token from Master: {e}")
                print(f"[Auth] Falling back to Direct KIS Refresh (WARNING: Risk of Conflict)")
                # Proceed to normal refresh below as fallback?
                # Or re-raise? 
                # If we fallback, we risk invalidating Master. It's safer to Fail.
                # But user might want fallback. Let's fallback but Log heavily.
                pass 

        # Normal Direct Refresh Logic
        url = f"{get_base_url()}/oauth2/tokenP"
        
        app_key = decrypt_data(account.app_key)
        app_secret = decrypt_data(account.app_secret)
        
        if not app_key or not app_secret:
             raise ValueError("Credentials missing for account")

        payload = {
            "grant_type": "client_credentials",
            "appkey": app_key,
            "appsecret": app_secret
        }
        
        try:
            res = requests.post(url, json=payload)
            res.raise_for_status()
            data = res.json()
            
            new_token = data["access_token"]
            expires_in = data.get("expires_in", 86400)
            
            # Update DB
            account.access_token = encrypt_data(new_token)
            account.token_expired_at = datetime.now() + timedelta(seconds=expires_in)
            
            db.commit()
            db.refresh(account)
            
            return new_token
            
        except Exception as e:
            if 'res' in locals() and res is not None:
                print(f"[Auth] KIS Error Response: {res.text}")
            print(f"[Auth] Error refreshing token: {e}")
            raise e

    @classmethod
    def check_and_refresh_all_accounts(cls, db: Session):
        """
        Check all accounts and refresh tokens if they expire within 1 hour.
        """
        print(f"[Auth] Checking for expiring tokens at {datetime.now()}...")
        accounts = db.query(Account).all()
        count = 0
        for account in accounts:
            if not account.access_token or not account.token_expired_at:
                continue
            
            # Check if expires in less than 1 hour (3600 seconds)
            # Buffer: If remaining time < 3600s, refresh.
            remaining = (account.token_expired_at - datetime.now()).total_seconds()
            if remaining < 3600:
                try:
                    print(f"[Auth] Token for {account.alias} expires in {int(remaining)}s. Refreshing...")
                    cls._refresh_token(account, db)
                    count += 1
                except Exception as e:
                    print(f"[Auth] Failed to auto-refresh token for {account.alias}: {e}")
        
        if count > 0:
            print(f"[Auth] Refreshed {count} tokens.")
        else:
            print("[Auth] No tokens needed refresh.")
