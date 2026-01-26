import streamlit as st
import pandas as pd
import plotly.express as px
from frontend.services.api_connector import APIConnector

def render_dashboard():
    st.subheader("자산 현황")
    
    if st.button("데이터 새로고침"):
        st.experimental_rerun()

    account_id = st.session_state.get("active_account_id")
    if not account_id:
        st.warning("사이드바에서 계좌를 선택해주세요.")
        return

    data = APIConnector.get_balance(account_id)
    
    if not data:
        st.warning("데이터가 없습니다. 백엔드 연결을 확인해주세요.")
        return

    # KIS API commonly returns output1 (holdings) and output2 (summary)
    holdings = data.get("output1", [])
    summary = data.get("output2", [{}])[0]
    
    # 1. Summary Metrics
    col1, col2, col3 = st.columns(3)
    total_asset = float(summary.get("dnca_tot_amt", 0)) # Cash + Eval
    cash_balance = float(summary.get("nxdy_excc_amt", 0)) # Next Day Execute Amount approx Cash
    
    col1.metric("총 자산", f"{total_asset:,.0f} KRW")
    col2.metric("예수금 (D+2)", f"{cash_balance:,.0f} KRW")
    col3.metric("주식 평가금액", f"{total_asset - cash_balance:,.0f} KRW")
    
    st.divider()
    
    # 2. Holdings Table & Chart
    if holdings:
        df = pd.DataFrame(holdings)
        # Rename cols for display
        # pdno: Code, prdt_name: Name, hldg_qty: Qty, evlu_pfls_amt: P/L
        display_df = df[["pdno", "prdt_name", "hldg_qty", "evlu_pfls_amt"]].copy()
        display_df.columns = ["종목코드", "종목명", "보유수량", "평가손익"]
        
        st.dataframe(display_df, use_container_width=True)
        
        # Pie Chart
        # Need current valuation for Pie Chart. (qty * current_price) or similar.
        # Assuming we can calculate or use a field. 
        # For Mock, let's use hldg_qty * 50000 (rough guess) or just count.
        # Real API returns 'evlu_amt' (eval amount).
        
        if "evlu_amt" in df.columns:
            # Rename for chart
            df = df.rename(columns={"prdt_name": "종목명", "evlu_amt": "평가금액"})
            fig = px.pie(df, values="평가금액", names="종목명", title="포트폴리오 비중")
            st.plotly_chart(fig)
        else:
             st.info("원형 차트를 그리려면 API 응답에 'evlu_amt' 필드가 필요합니다.")
    else:
        st.info("보유 종목이 없습니다.")
