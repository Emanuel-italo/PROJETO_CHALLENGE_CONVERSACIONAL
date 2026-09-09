from __future__ import annotations
import logging
from fastapi import APIRouter, File, HTTPException, UploadFile
from ..llm import LLMError
from ..schemas import TranscriptionResponse
from ..stt import stt_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["speech"])


@router.post("/speech/transcribe", response_model=TranscriptionResponse)
async def transcribe(file: UploadFile = File(...)) -> TranscriptionResponse:
    if not stt_client.enabled:
        raise HTTPException(503, "Serviço de voz não configurado.")

    audio_bytes = await file.read()

    if not audio_bytes:
        raise HTTPException(400, "Arquivo de áudio vazio.")

    try:
        text = await stt_client.transcribe(
            audio_bytes,
            file.filename or "gravacao.m4a",
            file.content_type or "audio/m4a",
        )
    except LLMError as exc:
        logger.warning("Falha ao transcrever áudio: %s", exc)
        raise HTTPException(502, str(exc)) from exc

    return TranscriptionResponse(text=text)
