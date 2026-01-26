import requests
import streamlit as st

API_BASE_URL = "http://localhost:8000/v1"

class APIConnector:
    @staticmethod
    def get_balance(account_id):
        try:
            # New Endpoint: /accounts/{id}/balance
            res = requests.get(f"{API_BASE_URL}/accounts/{account_id}/balance")
            res.raise_for_status()
            return res.json()
        except requests.RequestException as e:
            st.error(f"Failed to fetch balance: {e}")
            return None

    @staticmethod
    def place_order(account_id, ticker, quantity, price, action, strategy_id="manual"):
        payload = {
            "account_id": account_id,
            "ticker": ticker,
            "quantity": quantity,
            "price": price,
            "action": action,
            "strategy_id": strategy_id
        }
        try:
            res = requests.post(f"{API_BASE_URL}/trade/order", json=payload)
            res.raise_for_status()
            return res.json()
        except requests.RequestException as e:
            st.error(f"Failed to place order: {e}")
            return None
