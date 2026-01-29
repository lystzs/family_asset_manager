# 🔌 System Integration Guide: Token Issuance

This document explains how external systems (e.g., Quant Bots, Local Dev Environments, Dashboard Extensions) can securely obtain a **valid KIS Access Token** from the Family Asset Manager (FAM) Backend.

## Overview

The FAM Backend acts as a **Centralized Gateway**. It manages the lifecycle of KIS API tokens (issuance, caching, auto-refresh) so that individual clients do not need to manage tokens themselves.

**By using this API, you ensure:**
1.  **Compliance**: Adherence to KIS API's strict "1 Token per Account" policy.
2.  **Efficiency**: Eliminating redundant token requests that hit API limits.
3.  **Stability**: Preventing token invalidation conflicts between multiple systems.

---

## 🔐 1. Prerequisites

To use this API, the requesting system must possess the **Shared Secret Key (`SYNC_API_KEY`)**.
This key is defined in the Backend's environment variables (`.env`).

```bash
# Example .env on Backend
SYNC_API_KEY=your_secure_shared_secret
```

---

## 📡 2. API Specification

### Get KIS Access Token

Retrieves a currently valid KIS Access Token for a specific account. If the cached token is expired or missing, the Backend will automatically refresh it before responding.

- **Endpoint**: `GET /api/v1/sync/kis-token/{account_number}`
- **Auth**: Header Authentication (`x-sync-key`)

#### Request Headers

| Header | Value | Description |
| :--- | :--- | :--- |
| `x-sync-key` | `{SYNC_API_KEY}` | The shared secret key defined in Backend `.env` |
| `Content-Type` | `application/json` | Standard JSON content type |

#### Path Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `account_number` | `string` | The target KIS Account Number (e.g., `50101234`) |

#### Response (200 OK)

 Returns a specific JSON object containing the decrypted valid token.

```json
{
  "access_token": "eyJ0eXAiOiJK...",
  "expired_at": "2026-01-29T14:00:00.123456"
}
```

- `access_token`: Ready-to-use KIS API Token (Bearer).
- `expired_at`: Expiration timestamp (ISO 8601).

#### Error Responses

| Status Code | Description |
| :--- | :--- |
| `403 Forbidden` | Invalid or missing `x-sync-key`. |
| `404 Not Found` | The specified `account_number` does not exist in the DB. |
| `500 Internal Error` | KIS API failure (e.g., system maintenance, network error). |

---

## 💻 3. Implementation Example (Python)

Here is a simple Python function to fetch the token.

```python
import requests

# Configuration
BACKEND_URL = "http://192.168.68.51:8000"  # FAM Backend Address
SYNC_KEY = "fam_sync_secret"                # Shared Secret
ACCOUNT_NO = "50101234-01"                  # Target Account (Canonical Format)

def get_kis_token(account_no: str):
    url = f"{BACKEND_URL}/api/v1/sync/kis-token/{account_no}"
    headers = {
        "x-sync-key": SYNC_KEY
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        token = data["access_token"]
        expiry = data["expired_at"]
        
        print(f"✅ Token Acquired! Expires: {expiry}")
        return token
        
    except requests.exceptions.HTTPError as e:
        print(f"❌ HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"❌ unexpected Error: {e}")

if __name__ == "__main__":
    token = get_kis_token(ACCOUNT_NO.split("-")[0]) # Pass 8-digit CANO if endpoint expects that
    # Note: Check if endpoint expects 8-digit or full format.
    # Current implementation matches 'account_number' field in DB.
```

---

## ⚠️ Notes for Developers

1.  **Do NOT Refresh Manually**: Never call the KIS API's `/oauth2/tokenP` endpoint directly from your bot. This will invalidate the token used by the FAM Backend/Scheduler. Always ask the FAM Backend for the token.
2.  **Rate Limiting**: While there is no strict rate limit on this endpoint, caching mechanism is in place. You should cache the token in your application memory until it expires.
