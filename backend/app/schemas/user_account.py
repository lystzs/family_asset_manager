from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    name: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

# Account Schemas
class AccountBase(BaseModel):
    alias: str
    cano: str # Front 8
    acnt_prdt_cd: str # Back 2

class AccountCreate(AccountBase):
    app_key: str
    app_secret: str
    api_expiry_date: Optional[str] = None

class AccountUpdate(BaseModel):
    alias: Optional[str] = None
    cano: Optional[str] = None
    acnt_prdt_cd: Optional[str] = None
    app_key: Optional[str] = None
    app_secret: Optional[str] = None
    api_expiry_date: Optional[str] = None

class AccountResponse(AccountBase):
    id: int
    user_id: int
    api_expiry_date: Optional[str] = None
    token_expired_at: Optional[datetime] = None
    # Do not return sensitive keys
    class Config:
        from_attributes = True

class AccountWithUserResponse(AccountResponse):
    user_name: str

class AccountResponseWithKeys(AccountResponse):
    app_key: Optional[str] = None
    app_secret: Optional[str] = None
