import os
import requests

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_PHONE = os.getenv("TWILIO_FROM_PHONE")


def send_twilio_sms(to_phone: str, message: str) -> None:
    try:
        # Ensure the phone number has a + prefix (assume India +91 if missing and 10 digits)
        formatted_phone = to_phone if to_phone.startswith('+') else f"+91{to_phone[-10:]}"
        
        if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_PHONE):
            raise RuntimeError(
                "Twilio credentials are not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, "
                "and TWILIO_FROM_PHONE in environment variables."
            )
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        data = {
            "To": formatted_phone,
            "Body": message,
            "From": TWILIO_FROM_PHONE
        }
        
        # Don't block the main thread too long, timeout=5
        response = requests.post(url, data=data, auth=auth, timeout=5)
        if response.status_code not in (200, 201):
            print(f"Twilio SMS Error: {response.text}")
    except Exception as e:
        print(f"Twilio Exception: {e}")
