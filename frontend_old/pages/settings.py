import streamlit as st
import requests

API_BASE_URL = "http://localhost:8000/v1"

def render_settings():
    st.subheader("가족 구성원 및 계좌 관리")
    
    tab1, tab2 = st.tabs(["구성원 등록", "계좌 등록"])
    
    # --- Tab 1: Create User ---
    with tab1:
        with st.form("create_user_form"):
            name = st.text_input("구성원 이름 (예: 아버지)")
            submitted = st.form_submit_button("구성원 추가")
            
            if submitted:
                if not name:
                    st.error("이름을 입력해주세요.")
                else:
                    try:
                        res = requests.post(f"{API_BASE_URL}/users/", json={"name": name})
                        if res.status_code == 200:
                            st.success(f"'{name}' 구성원이 등록되었습니다.")
                            st.experimental_rerun()
                        else:
                            st.error(f"오류: {res.text}")
                    except Exception as e:
                        st.error(f"연결 오류: {e}")
        
        st.divider()
        st.write("### 등록된 구성원 목록")
        try:
            users_res = requests.get(f"{API_BASE_URL}/users/")
            if users_res.status_code == 200:
                users = users_res.json()
                for u in users:
                    st.write(f"- {u['name']} (ID: {u['id']})")
            else:
                st.error("구성원 목록을 불러오지 못했습니다.")
        except Exception:
            st.error("백엔드 연결 실패")

    # --- Tab 2: Create Account ---
    with tab2:
        # Fetch users first
        try:
            users_res = requests.get(f"{API_BASE_URL}/users/")
            users = users_res.json() if users_res.status_code == 200 else []
        except:
            users = []
            
        if not users:
            st.warning("먼저 구성원을 등록해주세요.")
        else:
            user_options = {u['name']: u['id'] for u in users}
            selected_user_name = st.selectbox("구성원 선택", list(user_options.keys()))
            selected_user_id = user_options[selected_user_name]
            
            with st.form("create_account_form"):
                alias = st.text_input("계좌 별칭 (예: 아버지-주식)")
                cano = st.text_input("종합계좌번호 8자리 (CANO)")
                acnt_prdt_cd = st.text_input("계좌상품코드 2자리 (보통 01)", value="01")
                app_key = st.text_input("App Key", type="password")
                app_secret = st.text_input("App Secret", type="password")
                
                submitted_acc = st.form_submit_button("계좌 등록")
                
                if submitted_acc:
                    if not all([alias, cano, acnt_prdt_cd, app_key, app_secret]):
                         st.error("모든 항목을 입력해주세요.")
                    else:
                        payload = {
                            "alias": alias,
                            "cano": cano,
                            "acnt_prdt_cd": acnt_prdt_cd,
                            "app_key": app_key,
                            "app_secret": app_secret
                        }
                        try:
                            # POST /users/{id}/accounts
                            res = requests.post(f"{API_BASE_URL}/users/{selected_user_id}/accounts", json=payload)
                            if res.status_code == 200:
                                st.success(f"'{alias}' 계좌가 등록되었습니다.")
                            else:
                                st.error(f"오류: {res.text}")
                        except Exception as e:
                             st.error(f"연결 오류: {e}")
