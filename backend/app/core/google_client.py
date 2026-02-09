import gspread
from oauth2client.service_account import ServiceAccountCredentials
from backend.app.core.config import settings
import os
import logging

logger = logging.getLogger(__name__)

class GoogleSheetClient:
    SCOPE = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]

    @classmethod
    def get_client(cls):
        """
        Authenticate and return gspread client
        """
        json_path = os.path.join(settings.BASE_DIR, settings.GOOGLE_SHEET_JSON_PATH)
        
        if not os.path.exists(json_path):
            logger.error(f"Google Sheet Credentials not found at: {json_path}")
            return None
            
        try:
            creds = ServiceAccountCredentials.from_json_keyfile_name(json_path, cls.SCOPE)
            client = gspread.authorize(creds)
            return client
        except Exception as e:
            logger.error(f"Failed to authenticate with Google Sheets: {e}")
            return None

    @classmethod
    def get_worksheet(cls):
        """
        Get the specific worksheet defined in settings
        """
        if not settings.GOOGLE_SHEET_ID:
            logger.error("GOOGLE_SHEET_ID is not set.")
            return None
            
        client = cls.get_client()
        if not client:
            return None
            
        try:
            sheet = client.open_by_key(settings.GOOGLE_SHEET_ID)
            try:
                worksheet = sheet.worksheet(settings.GOOGLE_SHEET_TAB)
            except gspread.WorksheetNotFound:
                # If tab name is not found, try 0th index or error?
                # Let's try to list worksheets and pick first if default fails? 
                # No, stick to config.
                logger.error(f"Worksheet '{settings.GOOGLE_SHEET_TAB}' not found.")
                return None
                
            return worksheet
        except Exception as e:
            logger.error(f"Failed to open sheet ({settings.GOOGLE_SHEET_ID}): {e}")
            return None
