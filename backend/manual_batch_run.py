import sys
import os

# Set path so backend module can be found
sys.path.append(os.getcwd())

from backend.app.core.scheduler import execute_orders_by_action, record_daily_asset_job, scheduled_token_refresh

def run_manual_jobs():
    print("=== Manual Batch Job Trigger ===")
    
    # 1. Token Refresh
    print("\n[1/4] Refreshing Tokens...")
    try:
        scheduled_token_refresh()
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Sell Orders
    print("\n[2/4] Executing SELL Orders...")
    try:
        execute_orders_by_action("SELL")
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

    # 3. Buy Orders
    print("\n[3/4] Executing BUY Orders...")
    try:
        execute_orders_by_action("BUY")
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

    # 4. Asset Recording
    print("\n[4/4] Recording Daily Assets...")
    try:
        record_daily_asset_job()
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

    print("\n=== All Jobs Completed ===")

if __name__ == "__main__":
    run_manual_jobs()
