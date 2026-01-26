import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from backend.app.db.session import engine
from backend.app.models.target_portfolio import TargetPortfolio
from backend.app.db.base import Base
from sqlalchemy import text

def reset_table():
    with engine.connect() as conn:
        print("Dropping target_portfolios table...")
        conn.execute(text("DROP TABLE IF EXISTS target_portfolios"))
        conn.commit()
        print("Dropped.")
        
    print("Recreating tables...")
    # Base.metadata contains TargetPortfolio because we imported it
    Base.metadata.create_all(bind=engine)
    print("Done.")

if __name__ == "__main__":
    reset_table()
