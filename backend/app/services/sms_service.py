import os
import requests

from app.core.config import get_settings

settings = get_settings()

def send_twilio_sms(to_phone: str, message: str) -> None:
    try:
        # Ensure the phone number has a + prefix (assume India +91 if missing and 10 digits)
        formatted_phone = to_phone if to_phone.startswith('+') else f"+91{to_phone[-10:]}"
        
        if not (settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_number):
            raise RuntimeError(
                "Twilio credentials are not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, "
                "and TWILIO_FROM_NUMBER in environment variables."
            )
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json"
        auth = (settings.twilio_account_sid, settings.twilio_auth_token)
        data = {
            "To": formatted_phone,
            "Body": message,
            "From": settings.twilio_from_number
        }
        
        # Don't block the main thread too long, timeout=5
        response = requests.post(url, data=data, auth=auth, timeout=5)
        if response.status_code not in (200, 201):
            print(f"Twilio SMS Error: {response.text}")
    except Exception as e:
        print(f"Twilio Exception: {e}")
