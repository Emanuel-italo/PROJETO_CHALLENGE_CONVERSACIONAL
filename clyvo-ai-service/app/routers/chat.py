from __future__ import annotations
import logging
from fastapi import APIRouter
from ..config import settings
from ..llm import LLMError, llm_client
from ..prompts import SYSTEM_PROMPT, build_knowledge_context, build_pet_context
from ..rag import knowledge_base
from ..rules import evaluate_pet
from ..schemas import ChatRequest, ChatResponse, SuggestedAction, Urgency
from ..simulator import TERMOS_EMERGENCIA, _fold, simulate

VISION_TIMEOUT_SECONDS = 45.0

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])

ORDEM_URGENCIA = {
    Urgency.BAIXA: 0,
    Urgency.MEDIA: 1,
    Urgency.ALTA: 2,
    Urgency.EMERGENCIA: 3,
}


def _coerce(value: str | None, enum_cls, default):
    try:
        return enum_cls(value)
    except (ValueError, TypeError):
        return default


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
   
    evaluation = evaluate_pet(request.pet) if request.pet else None


    passages = knowledge_base.search(request.message)
    sources = [chunk.title for chunk, _ in passages]


    tem_imagem = bool(request.imageBase64)

    blocos = [
        build_pet_context(request.pet, evaluation),
        build_knowledge_context([(chunk.title, chunk.text) for chunk, _ in passages]),
        f"PERGUNTA DO TUTOR\n{request.message}",
    ]
    user_content_texto = "\n\n".join(b for b in blocos if b)

    if tem_imagem:
        user_message = {
            "role": "user",
            "content": [
                {"type": "text", "text": user_content_texto},
                {"type": "image_url", "image_url": {"url": request.imageBase64}},
            ],
        }
    else:
        user_message = {"role": "user", "content": user_content_texto}

    historico = [{"role": m.role, "content": m.content} for m in request.history[-8:]]
    messages = [*historico, user_message]


    simulated = False
    llm_error: str | None = None
    if llm_client.enabled:
        try:
            raw = await llm_client.complete_json(
                SYSTEM_PROMPT,
                messages,
                model=settings.vision_model if tem_imagem else None,
                timeout=VISION_TIMEOUT_SECONDS if tem_imagem else None,
            )
        except LLMError as exc:
            logger.warning("Falha no LLM, caindo para modo simulado: %s", exc)
            if tem_imagem:
                raw = {
                    "reply": (
                        "Não consegui analisar a foto agora. Tente de novo em "
                        "instantes ou descreva o que você está vendo por texto."
                    ),
                    "urgency": Urgency.BAIXA.value,
                    "suggestedAction": SuggestedAction.NENHUMA.value,
                    "reason": "Falha na análise de imagem.",
                }
            else:
                raw = simulate(request.pet, request.message, evaluation, passages)
            simulated = True
            llm_error = str(exc)
    else:
        if tem_imagem:
            raw = {
                "reply": (
                    "A análise de fotos ainda não está configurada neste "
                    "servidor. Descreva o que você está vendo por texto."
                ),
                "urgency": Urgency.BAIXA.value,
                "suggestedAction": SuggestedAction.NENHUMA.value,
                "reason": "LLM não configurado.",
            }
        else:
            raw = simulate(request.pet, request.message, evaluation, passages)
        simulated = True
        llm_error = "LLM não configurado (LLM_API_KEY ausente)."

    urgency = _coerce(raw.get("urgency"), Urgency, Urgency.MEDIA)
    action = _coerce(raw.get("suggestedAction"), SuggestedAction, SuggestedAction.NENHUMA)
    reply = str(raw.get("reply") or "").strip()
    reason = str(raw.get("reason") or "").strip()


    texto = _fold(request.message)
    if any(t in texto for t in TERMOS_EMERGENCIA):
        if ORDEM_URGENCIA[urgency] < ORDEM_URGENCIA[Urgency.EMERGENCIA]:
            urgency = Urgency.EMERGENCIA
            action = SuggestedAction.PROCURAR_EMERGENCIA
            reason = (reason + " | Urgência elevada pelo motor de regras: "
                      "relato contém sinal de emergência.").strip(" |")
            reply = (
                "Pelo que você descreveu, isso não pode esperar: procure atendimento "
                "veterinário de emergência agora. " + reply
            )

    if not reply:
        reply = (
            "Não consegui gerar uma resposta agora. Se houver qualquer sinal de piora, "
            "procure a clínica."
        )

    return ChatResponse(
        reply=reply,
        urgency=urgency,
        suggestedAction=action,
        reason=reason,
        sources=sources,
        alerts=evaluation.alerts if evaluation else [],
        simulated=simulated,
        llmError=llm_error,
    )