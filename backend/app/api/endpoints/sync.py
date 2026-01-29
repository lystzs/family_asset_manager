from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from backend.app.db.session import SessionLocal
from backend.app.models import Account
from backend.app.core.config import settings
from backend.app.core.security import decrypt_data
from backend.app.core.auth_manager import AuthManager

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_sync_key(x_sync_key: str = Header(...)):
    if x_sync_key != settings.SYNC_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid Sync Key")

@router.get("/kis-token/{account_number}")
def get_kis_token(account_number: str, db: Session = Depends(get_db), authorized: bool = Depends(verify_sync_key)):
    """
    [Internal] Export valid KIS token for sync.
    Only allows extraction if local server has a valid one.
    Triggers refresh if local one is expired (act as Master).
    """
    # Direct lookup is impossible due to encryption with random IV
    # We must iterate and decrypt. Since account count is low (<10), this is acceptable.
    accounts = db.query(Account).all()
    account = None
    for acc in accounts:
        try:
            decrypted_cano = decrypt_data(acc.cano)
            if decrypted_cano == account_number:
                account = acc
                break
        except Exception:
            continue
            
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        # Ensure we have a valid token (force refresh if needed)
        # We use AuthManager.get_token which handles validation & refresh
        token = AuthManager.get_token(account, db)
        
        # Return simplified data
        return {
            "access_token": token, # AuthManager.get_token returns decrypted token
            "expired_at": account.token_expired_at.isoformat() if account.token_expired_at else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
