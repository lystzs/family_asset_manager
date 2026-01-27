
import sys
import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add project root to sys.path
sys.path.append(os.getcwd())

from backend.app.core.kis_client import KisClient
from backend.app.models import Account
from backend.app.core.config import settings

# Setup DB
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)
db = Session()

# Get Account (ID 3 based on context)
account = db.query(Account).filter(Account.id == 3).first()
if not account:
    print("Account 3 not found")
    sys.exit(1)

print(f"Testing Unfilled Orders for Account: {account.alias} ({account.cano})")

try:
    result = KisClient.get_unfilled_orders(account, db)
    
    print("\n--- RAW RESPONSE KEYS ---")
    print(list(result.keys()))
    
    if "output" in result:
        print(f"\n--- OUTPUT (Count: {len(result['output'])}) ---")
        print(json.dumps(result['output'], indent=2, ensure_ascii=False))
        
    if "output1" in result:
        print(f"\n--- OUTPUT1 (Count: {len(result['output1'])}) ---")
        print(json.dumps(result['output1'], indent=2, ensure_ascii=False))
        
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
