from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import requests

from app.db import get_db
from app.core.config import get_settings
from app.services.auth_service import auth_service
from app.schemas.user import UserRead
from app.models.user import User
from app.services.sms_service import send_twilio_sms

router = APIRouter(prefix="/chat", tags=["chat"])
settings = get_settings()

class ChatMessageRequest(BaseModel):
    phone: str
    message: str
    user_id: int

@router.post("/send")
def send_chat_message(payload: ChatMessageRequest, session: Session = Depends(get_db)):
    """Send an SMS-based chat message using Fast2SMS."""
    
    current_user = session.get(User, payload.user_id)
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        send_twilio_sms(payload.phone, f"EcoSync Message from {current_user.name}:\n{payload.message}")
        return {"status": "success", "message": "Message sent via Twilio successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SMS Gateway Error: {str(e)}")
