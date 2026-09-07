"""Ponto de entrada do serviço de IA da CLYVO VET."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    body = await request.body()

    logging.error("========== ERRO 422 ==========")
    logging.error("URL: %s", request.url)
    logging.error("BODY RECEBIDO: %s", body.decode("utf-8", errors="replace"))
    logging.error("ERROS DE VALIDAÇÃO: %s", exc.errors())
    logging.error("================================")

    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
        },
    )


app.include_router(chat.router)
app.include_router(alerts.router)


@app.get("/", tags=["infra"])
def root() -> dict:
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "llm_enabled": llm_client.enabled,
        "llm_model": settings.llm_model,
    }


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
        "rag": {
            "backend": knowledge_base.backend_name,
            "chunks": len(knowledge_base.chunks),
        },
    }