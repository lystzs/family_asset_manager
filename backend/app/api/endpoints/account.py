from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.session import get_db
from backend.app.models import User, Account
from backend.app.schemas.user_account import UserCreate, UserResponse, AccountCreate, AccountResponse
from backend.app.core.security import encrypt_data

router = APIRouter()

# --- Users ---
@router.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# --- Accounts ---
@router.post("/users/{user_id}/accounts", response_model=AccountResponse)
def create_account(user_id: int, account: AccountCreate, db: Session = Depends(get_db)):
    # Check User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Encrypt Sensitive Data
    db_account = Account(
        user_id=user_id,
        alias=account.alias,
        cano=encrypt_data(account.cano),
        acnt_prdt_cd=account.acnt_prdt_cd,
        app_key=encrypt_data(account.app_key),
        app_secret=encrypt_data(account.app_secret)
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    
    # Return decrypted (or masked) for response? 
    # Response model expects strings, but we stored encrypted.
    # ideally we return cano masked.
    # For now, let's just return what is in DB (encrypted) or decrypt it?
    # Let's decrypt 'cano' for display safety? Or just return as is?
    # Schema says 'cano: str'.
    # IMPORTANT: We should probably return decrypted CANO/ALIAS but NOT keys.
    # Let's override response to handle decryption if needed, OR just return simple success message.
    
    # For simplicity, returning the object will return encrypted strings.
    # This might be confusing. Let's iterate.
    return db_account

@router.get("/users/{user_id}/accounts", response_model=List[AccountResponse])
def get_accounts(user_id: int, db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.user_id == user_id).all()
    # TODO: Decrypt cano?
    return accounts

from backend.app.core.kis_client import KisClient
from backend.app.core.security import decrypt_data

@router.get("/accounts/{account_id}/balance")
def get_account_balance(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Decrypt keys for usage (Not implemented in KisClient yet, need refactor)
    # For now, pass account object to KisClient
    try:
        return KisClient.get_balance(account=account, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
