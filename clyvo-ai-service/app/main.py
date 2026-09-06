"""Ponto de entrada do serviço de IA da CLYVO VET."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .llm import llm_client
from .rag import knowledge_base
from .routers import alerts, chat

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


@app.get("/health", tags=["infra"])
def health() -> dict:
    """Health check — usado pelo App Service / ACI e pela pipeline de CD."""
    return {
        "status": "ok",
        "version": settings.app_version,
        "llm": {
            "enabled": llm_client.enabled,
            "model": settings.llm_model if llm_client.enabled else None,
            "mode": "live" if llm_client.enabled else "simulated",
        },
        "rag": {
            "backend": knowledge_base.backend_name,
            "chunks": len(knowledge_base.chunks),
        },
    }
