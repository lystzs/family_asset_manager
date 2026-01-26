import streamlit as st
from frontend.services.api_connector import APIConnector

def render_trade():
    st.subheader("수동 매매 주문")

    col1, col2 = st.columns([1, 1])

    with col1:
        with st.form("order_form"):
            st.write("### 주문 정보 입력")
            
            ticker = st.text_input("종목코드 (예: 005930)", value="005930")
            action = st.radio("매매 구분", ["BUY (매수)", "SELL (매도)"], horizontal=True)
            
            price_type = st.selectbox("가격 구분", ["Limit (지정가)", "Market (시장가)"])
            
            # If Market, price is 0 generally, but for simplicity let's stick to Limit for now or allow input
            price = st.number_input("주문 가격 (KRW)", min_value=0, value=70000, step=100)
            quantity = st.number_input("주문 수량", min_value=1, value=10, step=1)
            
            submitted = st.form_submit_button("주문 전송")
            
            if submitted:
                if not ticker:
                    st.error("종목코드를 입력해주세요.")
                else:
                    real_action = "BUY" if "BUY" in action else "SELL"
                    
                    if price_type.startswith("Market"):
                        price = 0 # Market price usually 0 in API fields request
                    
                    account_id = st.session_state.get("active_account_id")
                    if not account_id:
                        st.error("계좌를 선택해주세요.")
                    else:
                        st.info(f"주문 전송 중...: {real_action} {ticker} {quantity}주 @ {price}원")
                        
                        try:
                            res = APIConnector.place_order(account_id, ticker, quantity, float(price), real_action)
                        if res:
                            if res.get("rt_cd") == "0":
                                st.success("주문이 정상적으로 접수되었습니다!")
                                st.json(res)
                            else:
                                st.error(f"주문 실패: {res.get('msg1')}")
                                
                    except Exception as e:
                        st.error(f"오류 발생: {str(e)}")

    with col2:
        st.info("💡 주문 가이드")
        st.markdown("""
        - **종목코드**: 6자리 숫자 코드 (예: 삼성전자 005930)
        - **주문 가격**: 지정가 주문 시 가격 입력. 시장가는 0원 처리.
        - **주문 수량**: 매매할 주식 수.
        
        *매수 시 예수금, 매도 시 보유잔고가 충분한지 확인하세요.*
        """)
