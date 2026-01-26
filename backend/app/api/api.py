from fastapi import APIRouter
from backend.app.api.endpoints import users, accounts, trade, stocks, portfolio, scheduled_trade

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(trade.router, prefix="/trade", tags=["trade"])
api_router.include_router(stocks.router, prefix="/stocks", tags=["stocks"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(scheduled_trade.router, prefix="/trade/schedule", tags=["scheduled-trade"])
