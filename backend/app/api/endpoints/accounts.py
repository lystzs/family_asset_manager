from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models import Account, DailyAssetHistory
from backend.app.schemas.user_account import AccountResponse, AccountUpdate, AccountWithUserResponse
from backend.app.core.kis_client import KisClient
from backend.app.core.security import decrypt_data, encrypt_data
from typing import List

router = APIRouter()

@router.get("/", response_model=List[AccountWithUserResponse])
def get_all_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).all()
    results = []
    for acc in accounts:
        # Decrypt cano
        decrypted_app_key = decrypt_data(acc.app_key)
        decrypted_app_secret = decrypt_data(acc.app_secret)
        decrypted_cano = decrypt_data(acc.cano)
        
        acc_dict = {
            "id": acc.id,
            "user_id": acc.user_id,
            "alias": acc.alias,
            "cano": decrypted_cano,
            "acnt_prdt_cd": acc.acnt_prdt_cd,
            "app_key": decrypted_app_key,
            "app_secret": decrypted_app_secret,
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
        balance_data = KisClient.get_balance(account=account, db=db)
        
        # Inject Daily Metrics
        from datetime import datetime
        last_history = db.query(DailyAssetHistory).filter(
            DailyAssetHistory.account_id == account.id,
            DailyAssetHistory.date < datetime.now().date()
        ).order_by(DailyAssetHistory.date.desc()).first()
        
        daily_pl = 0
        daily_rate = 0.0
        
        if last_history and balance_data.get("output2"):
            current_total_pl = int(balance_data["output2"][0].get("evlu_pfls_smtl_amt", "0"))
            
            # Daily P/L = Current Total P/L - Previous Total P/L (Isolates market move)
            daily_pl = current_total_pl - last_history.total_profit_loss
            
            # Daily Rate = Daily P/L / Previous Total Asset
            if last_history.total_asset_amount > 0:
                daily_rate = (daily_pl / last_history.total_asset_amount) * 100
                daily_rate = round(daily_rate, 2)
        
        balance_data["daily_status"] = {
            "daily_profit_loss": daily_pl,
            "daily_profit_rate": daily_rate
        }
        
        return balance_data
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
        account.cano = encrypt_data(account_in.cano)
    if account_in.acnt_prdt_cd is not None:
        account.acnt_prdt_cd = account_in.acnt_prdt_cd
    if account_in.app_key is not None:
        account.app_key = encrypt_data(account_in.app_key)
        account.token_expired_at = None # Force refresh
    if account_in.app_secret is not None:
        account.app_secret = encrypt_data(account_in.app_secret)
        account.token_expired_at = None # Force refresh
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

@router.get("/history/aggregate")
def get_aggregated_history(db: Session = Depends(get_db)):
    """
    Get aggregated daily asset history for all accounts.
    """
    # Fetch all history records ordered by date
    all_history = db.query(DailyAssetHistory).order_by(DailyAssetHistory.date.asc()).all()
    
    # Aggregate by date
    agg_map = {}
    
    for record in all_history:
        d = record.date
        if d not in agg_map:
            agg_map[d] = {
                "date": d,
                "total_asset_amount": 0,
                "stock_eval_amount": 0,
                "cash_balance": 0,
                "total_profit_loss": 0,
                "total_profit_rate": 0.0,
                "daily_profit_loss": 0,
                "daily_profit_rate": 0.0,
                # Helpers for rate calc
                "prev_total_asset": 0
            }
        
        agg = agg_map[d]
        agg["total_asset_amount"] += record.total_asset_amount
        agg["stock_eval_amount"] += record.stock_eval_amount
        agg["cash_balance"] += record.cash_balance
        agg["total_profit_loss"] += record.total_profit_loss
        agg["daily_profit_loss"] += record.daily_profit_loss
        # Note: profit rates need recalculation after summation or weighted avg.
        # Simple summation of rates is wrong.
        # We will recalculate rates based on sums if possible, or leave as 0 if data missing.
    
    # Recalculate Rates
    # Total Profit Rate = (Total P/L / (Total Asset - Total P/L)) * 100 ??
    # No, Total P/L = Asset - Principal. Principal = Asset - P/L.
    # So P/L Rate = (P/L / Principal) * 100
    
    sorted_dates = sorted(agg_map.keys())
    results = []
    
    previous_total_asset = 0
    
    for d in sorted_dates:
        data = agg_map[d]
        
        # 1. Total Profit Rate
        principal = data["total_asset_amount"] - data["total_profit_loss"]
        if principal > 0:
            data["total_profit_rate"] = round((data["total_profit_loss"] / principal) * 100, 2)
        else:
            data["total_profit_rate"] = 0.0
            
        # 2. Daily Profit Rate
        # We need yesterday's total asset to calculate today's daily rate
        # Daily Rate = Daily P/L / Yesterday Total Asset
        if previous_total_asset > 0:
            data["daily_profit_rate"] = round((data["daily_profit_loss"] / previous_total_asset) * 100, 2)
        else:
             data["daily_profit_rate"] = 0.0
             
        previous_total_asset = data["total_asset_amount"]
        
        results.append(data)
        
    return results

@router.get("/{account_id}/history")
def get_account_history(account_id: int, db: Session = Depends(get_db)):
    """
    Get daily asset history for the account.
    """
    history = db.query(DailyAssetHistory).filter(
        DailyAssetHistory.account_id == account_id
    ).order_by(DailyAssetHistory.date.asc()).all()
    
    return history
