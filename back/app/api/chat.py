from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.services import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    messages: list[dict]
    context_type: Optional[str] = None
    context_id: Optional[str] = None


@router.post("/stream")
async def chat_stream(body: ChatRequest, db: Session = Depends(get_db)):
    return StreamingResponse(
        chat_service.stream_chat(body.messages, body.context_type, body.context_id, db),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
