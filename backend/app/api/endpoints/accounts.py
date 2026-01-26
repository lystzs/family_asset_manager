from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models import Account
from backend.app.schemas.user_account import AccountResponse, AccountUpdate, AccountWithUserResponse
from backend.app.core.kis_client import KisClient
from backend.app.core.security import decrypt_data
from typing import List

router = APIRouter()

@router.get("/", response_model=List[AccountWithUserResponse])
def get_all_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).all()
    results = []
    for acc in accounts:
        # Decrypt cano
        decrypted_cano = decrypt_data(acc.cano)
        acc_dict = {
            "id": acc.id,
            "user_id": acc.user_id,
            "alias": acc.alias,
            "cano": decrypted_cano,
            "acnt_prdt_cd": acc.acnt_prdt_cd,
            "api_expiry_date": acc.api_expiry_date,
            "token_expired_at": acc.token_expired_at,
            "user_name": acc.user.name if acc.user else "Unknown"
        }
        results.append(acc_dict)
    return results

@router.get("/{account_id}/balance")
def get_account_balance(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        return KisClient.get_balance(account=account, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    db.delete(account)
    db.commit()
    return {"message": "Account deleted"}

@router.put("/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, account_in: AccountUpdate, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Update fields if provided
    if account_in.alias is not None:
        account.alias = account_in.alias
    if account_in.cano is not None:
        account.cano = account_in.cano
    if account_in.acnt_prdt_cd is not None:
        account.acnt_prdt_cd = account_in.acnt_prdt_cd
    if account_in.app_key is not None:
        account.app_key = account_in.app_key
    if account_in.app_secret is not None:
        account.app_secret = account_in.app_secret
    try:
        db.commit()
        db.refresh(account)
        return account
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{account_id}/token")
def refresh_account_token(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    try:
        from backend.app.core.auth_manager import AuthManager
        # Force refresh
        token = AuthManager._refresh_token(account, db)
        return {
            "message": "Token refreshed successfully",
            "token_expired_at": account.token_expired_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
