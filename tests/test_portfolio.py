import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import get_db
from backend.app.models import User, Account, TargetPortfolio
from backend.app.core.security import encrypt_data

client = TestClient(app)

def test_portfolio_crud(db_session):
    # 1. Create User
    user = User(name="Test User")
    db_session.add(user)
    db_session.commit()
    
    # 2. Add Target
    payload = {
        "user_id": user.id,
        "stock_code": "005930",
        "stock_name": "삼성전자",
        "target_percentage": 50.0
    }
    response = client.post(f"/v1/portfolio/{user.id}", json=payload)
    assert response.status_code == 200
    assert response.json()["stock_code"] == "005930"
    
    # 3. Get Portfolio
    response = client.get(f"/v1/portfolio/{user.id}")
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # 4. Delete Target
    portfolio_id = response.json()[0]["id"]
    response = client.delete(f"/v1/portfolio/{portfolio_id}")
    assert response.status_code == 200
    
    # 5. Check empty
    response = client.get(f"/v1/portfolio/{user.id}")
    assert len(response.json()) == 0

# Note: Testing analysis requires KIS API mocks which are complex to setup here.
# But we can verify the endpoint exists.
