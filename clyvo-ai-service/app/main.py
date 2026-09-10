import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .llm import llm_client
from .rag import knowledge_base
from .routers import alerts, chat, rpa, speech
from .stt import stt_client
from .tts import tts_client
from . import scheduler

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Camada de IA da CLYVO VET: assistente conversacional com contexto clínico "
        "do pet (RAG + LLM) e motor de regras determinístico para alertas da "
        "jornada de saúde."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(alerts.router)
app.include_router(rpa.router)
app.include_router(speech.router)


@app.on_event("startup")
async def iniciar_rpa() -> None:
    scheduler.iniciar()


@app.on_event("shutdown")
async def encerrar_rpa() -> None:
    await scheduler.parar()


@app.get("/health", tags=["infra"])
def health() -> dict:
    return {
        "status": "ok",
        "version": settings.app_version,
        "llm": {
            "enabled": llm_client.enabled,
            "model": settings.llm_model if llm_client.enabled else None,
            "mode": "live" if llm_client.enabled else "simulated",
        },
        "vision": {
            "enabled": llm_client.enabled,
            "model": settings.vision_model if llm_client.enabled else None,
        },
        "rag": {
            "backend": knowledge_base.backend_name,
            "chunks": len(knowledge_base.chunks),
        },
        "stt": {
            "enabled": stt_client.enabled,
            "model": settings.stt_model if stt_client.enabled else None,
        },
        "tts": {
            "enabled": tts_client.enabled,
            "voiceId": settings.elevenlabs_voice_id if tts_client.enabled else None,
        },
        "rpa": {
            "enabled": settings.rpa_enabled,
            "schedule": f"{settings.rpa_hour:02d}:{settings.rpa_minute:02d}",
            "timezone": settings.rpa_timezone,
            "emailProvider": settings.email_provider,
        },
    }
