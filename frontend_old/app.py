import streamlit as st

st.set_page_config(
    page_title="FAM v3.0",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("가족 자산 관리 시스템 (FAM v3.0)")

import requests
from frontend.services.api_connector import API_BASE_URL

# Sidebar
st.sidebar.title("메뉴")
page = st.sidebar.radio("이동", ["대시보드", "트레이딩", "설정"])

st.sidebar.divider()
st.sidebar.subheader("계좌 선택")

# Fetch Users for Sidebar
try:
    users_res = requests.get(f"{API_BASE_URL}/users/")
    users = users_res.json() if users_res.status_code == 200 else []
except:
    users = []

selected_account_id = None

if users:
    user_names = [u['name'] for u in users]
    selected_user_name = st.sidebar.selectbox("구성원", user_names)
    selected_user = next((u for u in users if u['name'] == selected_user_name), None)
    
    if selected_user:
        # Fetch Accounts for User
        try:
            acc_res = requests.get(f"{API_BASE_URL}/users/{selected_user['id']}/accounts")
            accounts = acc_res.json() if acc_res.status_code == 200 else []
        except:
            accounts = []
            
        if accounts:
            acc_aliases = [a['alias'] for a in accounts]
            selected_acc_alias = st.sidebar.selectbox("계좌", acc_aliases)
            selected_account = next((a for a in accounts if a['alias'] == selected_acc_alias), None)
            if selected_account:
                selected_account_id = selected_account['id']
                st.session_state["active_account_id"] = selected_account_id
                st.sidebar.success(f"사용중: {selected_acc_alias}")
        else:
            st.sidebar.warning("등록된 계좌가 없습니다")
else:
    st.sidebar.info("설정에서 구성원을 등록하세요")

if page == "대시보드":
    try:
        from frontend.pages.dashboard import render_dashboard
        render_dashboard()
    except ImportError:
        st.info("대시보드 모듈을 찾을 수 없습니다.")

elif page == "트레이딩":
    try:
        from frontend.pages.trade import render_trade
        render_trade()
    except ImportError as e:
        st.error(f"트레이딩 모듈 오류: {e}")

elif page == "설정":
    st.header("시스템 설정")
    st.write("설정은 .env 파일에서 관리됩니다.")
