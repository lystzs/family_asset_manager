from cryptography.fernet import Fernet
from backend.app.core.config import settings
import base64
import hashlib

# Derive a 32-byte key from the SECRET_KEY for Fernet
def _get_start_key():
    key = settings.SECRET_KEY.encode()
    digest = hashlib.sha256(key).digest()
    return base64.urlsafe_b64encode(digest)

_cipher_suite = Fernet(_get_start_key())

def encrypt_data(data: str) -> str:
    """Encrypt sensitive string data"""
    if not data:
        return ""
    return _cipher_suite.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    """Decrypt sensitive string data"""
    if not token:
        return ""
    try:
        return _cipher_suite.decrypt(token.encode()).decode()
    except Exception:
        return ""
