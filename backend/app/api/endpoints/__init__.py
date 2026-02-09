# Explicit imports to make endpoint modules accessible
# This allows: from backend.app.api.endpoints import system, batch, etc.
from . import (
    users,
    accounts,
    trade,
    stocks,
    portfolio,
    scheduled_trade,
    websocket,
    batch,
    sync,
    logs,
    system,
)

__all__ = [
    "users",
    "accounts",
    "trade",
    "stocks",
    "portfolio",
    "scheduled_trade",
    "websocket",
    "batch",
    "sync",
    "logs",
    "system",
]
