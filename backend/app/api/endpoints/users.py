from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.session import get_db
from backend.app.models import User, Account
from backend.app.schemas.user_account import UserCreate, UserResponse, AccountCreate, AccountResponse, AccountResponseWithKeys
from backend.app.core.security import encrypt_data

router = APIRouter()

# --- Users ---
@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(name=user.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Optional: Delete associated accounts first if cascade not set
    db.query(Account).filter(Account.user_id == user_id).delete()
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

# --- Account Creation (Sub-resource of User) ---
@router.post("/{user_id}/accounts", response_model=AccountResponse)
def create_account(user_id: int, account: AccountCreate, db: Session = Depends(get_db)):
    # Check User
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check for duplicate CANO (Decryption required due to randomized encryption)
    from backend.app.core.security import decrypt_data
    existing_accounts = db.query(Account).filter(Account.user_id == user_id).all()
    for existing in existing_accounts:
        if decrypt_data(existing.cano) == account.cano:
            raise HTTPException(status_code=400, detail="Account already exists for this user")

    # Encrypt Sensitive Data
    db_account = Account(
        user_id=user_id,
        alias=account.alias,
        cano=encrypt_data(account.cano),
        acnt_prdt_cd=account.acnt_prdt_cd,
        app_key=encrypt_data(account.app_key),
        app_secret=encrypt_data(account.app_secret),
        api_expiry_date=account.api_expiry_date
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.get("/{user_id}/accounts", response_model=List[AccountResponseWithKeys])
def get_accounts(user_id: int, db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.user_id == user_id).all()
    # Decrypt CANO and Keys for display (User Requested)
    from backend.app.core.security import decrypt_data
    results = []
    for acc in accounts:
        # Pydantic will validate this against AccountResponseWithKeys
        acc_dict = {
            "id": acc.id,
            "user_id": acc.user_id,
            "alias": acc.alias,
            "cano": decrypt_data(acc.cano),
            "acnt_prdt_cd": acc.acnt_prdt_cd,
            "app_key": decrypt_data(acc.app_key) if acc.app_key else "",
            "app_secret": decrypt_data(acc.app_secret) if acc.app_secret else "",
            "api_expiry_date": acc.api_expiry_date,
            "token_expired_at": acc.token_expired_at
        }
        results.append(acc_dict)
    return results
