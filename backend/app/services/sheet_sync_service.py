from sqlalchemy.orm import Session
from backend.app.core.kis_client import KisClient
from backend.app.core.google_client import GoogleSheetClient
from backend.app.models import Account, TargetPortfolio
import logging
import time

logger = logging.getLogger(__name__)

class SheetSyncService:
    """
    Service to sync Investment Stock List to Google Sheets
    """
    
    @staticmethod
    def sync_daily_data(db: Session):
        """
        Syncs aggregated data for all accounts to Google Sheets.
        Overwrites the sheet with specific columns:
        [Code, Name, Qty, AvgPrice, CurPrice, PrevPrice, Diff, BuyAmt, EvalAmt, P/L, Return%, Weight%]
        """
        logger.info("[SheetSync] Starting Google Sheet Dashboard Sync...")
        
        worksheet = GoogleSheetClient.get_worksheet()
        if not worksheet:
            logger.error("[SheetSync] Worksheet not available. Aborting.")
            return

        accounts = db.query(Account).all()
        if not accounts:
            logger.error("[SheetSync] No accounts found.")
            return
            
        # 1. Aggregate Holdings
        all_holdings = []
        total_asset_sum = 0.0
        
        for account in accounts:
            logger.info(f"[SheetSync] Fetching data for Account: {account.alias}")
            try:
                balance_data = KisClient.get_balance(account, db)
                holdings = balance_data.get("output1", [])
                summary = balance_data.get("output2", [])[0]
                
                all_holdings.extend(holdings)
                total_asset_sum += float(summary.get("tot_evlu_amt", "0"))
                
            except Exception as e:
                logger.error(f"[SheetSync] Failed to fetch data for {account.alias}: {e}")
        
        if not all_holdings:
            logger.warning("[SheetSync] No holdings found.")
            return

        # Aggregation Map
        # Key: Stock Code
        agg_map = {}
        
        for h in all_holdings:
            code = h["pdno"]
            
            # Normalize Code (remove A prefix if KIS returns it, usually KIS returns numbers)
            # But we want to WRITE clean codes.
            
            name = h.get("prdt_name", "")
            qty = int(h.get("hldg_qty", 0))
            if qty == 0: continue
            
            # Prices
            current_price = float(h.get("prpr", 0))
            # The user wants "등락" to be the rate (%), not amount.
            # KIS 'prdy_ctrt' is "Previous Day Compare Rate" (e.g. "1.5" for 1.5%)
            day_diff_rate = float(h.get("prdy_ctrt", 0)) 
            
            # Amounts (Per account)
            # pchs_amt = Purchase Amount
            buy_amt = float(h.get("pchs_amt", 0)) 
            if buy_amt == 0: # Fallback
                buy_amt = float(h.get("pchs_avg_pric", 0)) * qty
                
            eval_amt = float(h.get("evlu_amt", 0))
            eval_pl = float(h.get("evlu_pfls_amt", 0))
            
            if code not in agg_map:
                agg_map[code] = {
                    "code": code,
                    "name": name,
                    "qty": 0,
                    "buy_amt": 0.0,
                    "eval_amt": 0.0,
                    "eval_pl": 0.0,
                    "cur_price": current_price,
                    "day_diff_rate": day_diff_rate
                }
            
            agg = agg_map[code]
            agg["qty"] += qty
            agg["buy_amt"] += buy_amt
            agg["eval_amt"] += eval_amt
            agg["eval_pl"] += eval_pl
            
            # Keep latest price (should be adequate)
            if current_price > 0:
                agg["cur_price"] = current_price
                agg["day_diff_rate"] = day_diff_rate
                # Update Name if missing
                if not agg["name"] and name:
                    agg["name"] = name

        # 2. Prepare Rows
        # Header: 종목코드, 종목명, 수량, 평균단가, 현재가, 전일가, 등락률, 매입금액, 평가금액, 평가손익, 수익률, 자산비중
        headers = ["종목코드", "종목명", "수량", "평균단가", "현재가", "전일가", "등락률", "매입금액", "평가금액", "평가손익", "수익률", "자산비중"]
        rows = [headers]
        
        for code, data in agg_map.items():
            qty = data["qty"]
            buy_amt = data["buy_amt"]
            eval_amt = data["eval_amt"]
            eval_pl = data["eval_pl"]
            cur_price = data["cur_price"]
            day_diff_rate = data["day_diff_rate"]
            
            # Derived
            avg_price = buy_amt / qty if qty > 0 else 0
            
            # Calculate Prev Price from Rate? 
            # PrevPrice = CurPrice / (1 + Rate/100)
            prev_price = 0
            if (1 + day_diff_rate/100) != 0:
                prev_price = cur_price / (1 + day_diff_rate/100)
            
            return_rate = 0.0
            if buy_amt > 0:
                return_rate = (eval_pl / buy_amt) * 100
            
            weight = 0.0
            if total_asset_sum > 0:
                weight = (eval_amt / total_asset_sum) * 100
                
            # Formatting
            row = [
                code,
                data["name"],
                qty,
                round(avg_price),      # Avg Price
                int(cur_price),        # Cur Price
                int(prev_price),       # Prev Price
                f"{round(day_diff_rate, 2)}%", # Diff Rate (%)
                int(buy_amt),          # Buy Amt
                int(eval_amt),         # Eval Amt
                int(eval_pl),          # Eval P/L
                f"{round(return_rate, 2)}%", # Return %
                f"{round(weight, 2)}%"       # Weight %
            ]

            rows.append(row)

        # Sort by Stock Name (Index 1)
        # rows[0] is header, so sort rows[1:]
        data_rows = rows[1:]
        data_rows.sort(key=lambda x: x[1]) # Sort by Name
        
        # Reassemble
        final_rows = [rows[0]] + data_rows
        # 3. Write to Sheet
        try:
            worksheet.clear() # Clear all content
            worksheet.update(values=final_rows) # Write all rows
            logger.info(f"[SheetSync] Dashboard Updated: {len(final_rows)-1} stocks.")
        except Exception as e:
            logger.error(f"[SheetSync] Failed to write to sheet: {e}")
