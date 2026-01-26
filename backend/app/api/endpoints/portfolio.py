from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.session import get_db
from backend.app.models.target_portfolio import TargetPortfolio
from backend.app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, PortfolioResponse, RebalanceAnalysis, TradeSuggestion

router = APIRouter()

@router.get("/{account_id}", response_model=List[PortfolioResponse])
def get_account_portfolio(account_id: int, db: Session = Depends(get_db)):
    """계좌별 목표 포트폴리오 리스트 조회"""
    return db.query(TargetPortfolio).filter(TargetPortfolio.account_id == account_id).all()

@router.post("/{account_id}", response_model=PortfolioResponse)
def add_or_update_target(account_id: int, portfolio: PortfolioCreate, db: Session = Depends(get_db)):
    """목표 종목 추가 또는 업데이트"""
    if portfolio.account_id != account_id:
        raise HTTPException(status_code=400, detail="Account ID mismatch")
    
    # Verify account exists
    from backend.app.models import Account
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    db_item = db.query(TargetPortfolio).filter(
        TargetPortfolio.account_id == account_id,
        TargetPortfolio.stock_code == portfolio.stock_code
    ).first()
    
    if db_item:
        db_item.target_percentage = portfolio.target_percentage
        db_item.stock_name = portfolio.stock_name
    else:
        db_item = TargetPortfolio(**portfolio.model_dump())
        db.add(db_item)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{portfolio_id}")
def delete_target(portfolio_id: int, db: Session = Depends(get_db)):
    """목표 종목 삭제"""
    db_item = db.query(TargetPortfolio).filter(TargetPortfolio.id == portfolio_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    db.delete(db_item)
    db.commit()
    return {"message": "Deleted successfully"}

@router.get("/{user_id}/analysis/{account_id}", response_model=RebalanceAnalysis)
async def analyze_rebalance(user_id: int, account_id: int, db: Session = Depends(get_db)):
    """리밸런싱 분석 실행"""
    from backend.app.models import Account
    from backend.app.core.kis_client import KisClient

    # 1. 계좌 정보 가져오기
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # 2. 목표 포트폴리오 가져오기
    targets = db.query(TargetPortfolio).filter(TargetPortfolio.account_id == account_id).all()
    if not targets:
        raise HTTPException(status_code=400, detail="Target portfolio not set")

    # 3. 현재 잔고 가져오기
    try:
        balance_data = KisClient.get_balance(account=account, db=db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch balance: {str(e)}")

    total_asset = float(balance_data["output2"][0]["tot_evlu_amt"])
    current_cash = float(balance_data["output2"][0]["dnca_tot_amt"])
    holdings = {item["pdno"]: item for item in balance_data["output1"]}

    # 4. 분석 및 제안 생성
    suggestions = []
    total_target_pct = sum(t.target_percentage for t in targets)
    
    for t in targets:
        # HANDLING CASH
        if t.stock_code == "CASH":
            current_price = 1.0
            current_qty = int(current_cash) # Cash Amount
            current_value = current_cash
            
            target_value = total_asset * (t.target_percentage / 100.0)
            diff_value = target_value - current_value
            
            suggested_qty = int(diff_value)
            action = "RESERVE" # Just a marker
            
            suggestions.append(TradeSuggestion(
                stock_code=t.stock_code,
                stock_name=t.stock_name,
                current_qty=current_qty,
                current_price=current_price,
                current_value=current_value,
                target_value=target_value,
                diff_value=diff_value,
                suggested_qty=suggested_qty,
                action=action
            ))
            continue

        # HANDLING STOCKS
        holding = holdings.get(t.stock_code)
        current_qty = int(holding["hldg_qty"]) if holding else 0
        
        if holding:
            current_price = float(holding["prpr"])
            current_value = float(holding["evlu_amt"])
        else:
            # 보유 중이지 않은 경우 현재가 따로 조회
            try:
                price_data = KisClient.get_price(account=account, db=db, ticker=t.stock_code)
                current_price = float(price_data["output"]["stck_prpr"])
            except:
                current_price = 0.0
            current_value = 0.0

        target_value = total_asset * (t.target_percentage / 100.0)
        diff_value = target_value - current_value
        
        # 대략적인 주문 수량 (현재가 기준)
        suggested_qty = 0
        action = "HOLD"
        
        if current_price > 0:
            qty_raw = diff_value / current_price
            if qty_raw >= 1.0:
                action = "BUY"
                suggested_qty = int(qty_raw)
            elif qty_raw <= -1.0:
                action = "SELL"
                suggested_qty = int(abs(qty_raw))
            else:
                action = "HOLD"

        suggestions.append(TradeSuggestion(
            stock_code=t.stock_code,
            stock_name=t.stock_name,
            current_qty=current_qty,
            current_price=current_price,
            current_value=current_value,
            target_value=target_value,
            diff_value=diff_value,
            suggested_qty=suggested_qty,
            action=action
        ))

    # 5. 목표에 없는 보유 종목 처리 (전량 매도 제안)
    target_stock_codes = set(t.stock_code for t in targets)
    
    for stock_code, holding in holdings.items():
        if stock_code not in target_stock_codes:
            current_qty = int(holding["hldg_qty"])
            current_price = float(holding["prpr"])
            current_value = float(holding["evlu_amt"])
            
            # 목표가 0원이므로 현재 가치만큼 매도 필요
            target_value = 0.0
            diff_value = -current_value
            suggested_qty = current_qty
            action = "SELL"
            
            suggestions.append(TradeSuggestion(
                stock_code=stock_code,
                stock_name=holding["prdt_name"],
                current_qty=current_qty,
                current_price=current_price,
                current_value=current_value,
                target_value=target_value,
                diff_value=diff_value,
                suggested_qty=suggested_qty,
                action=action
            ))

    return RebalanceAnalysis(
        user_id=user_id,
        account_id=account_id,
        total_asset=total_asset,
        current_cash=current_cash,
        items=suggestions,
        summary={"total_target_pct": total_target_pct}
    )
