from sqlalchemy import Column, Integer, String
from backend.app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # "아버지", "어머니"
    # role = Column(String, default="viewer") # Removed for now to stick to spec, or keep? 
    # Let's keep it simple as per request: id, name.
