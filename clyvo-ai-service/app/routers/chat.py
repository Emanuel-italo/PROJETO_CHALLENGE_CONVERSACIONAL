from __future__ import annotations
import logging
from fastapi import APIRouter
from ..llm import LLMError, llm_client
from ..prompts import SYSTEM_PROMPT, build_knowledge_context, build_pet_context
from ..rag import knowledge_base
from ..rules import evaluate_pet
from ..schemas import ChatRequest, ChatResponse, SuggestedAction, Urgency
from ..simulator import TERMOS_EMERGENCIA, _fold, simulate

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


    blocos = [
        build_pet_context(request.pet, evaluation),
        build_knowledge_context([(chunk.title, chunk.text) for chunk, _ in passages]),
        f"PERGUNTA DO TUTOR\n{request.message}",
    ]
    user_content = "\n\n".join(b for b in blocos if b)

    historico = [{"role": m.role, "content": m.content} for m in request.history[-8:]]
    messages = [*historico, {"role": "user", "content": user_content}]


    simulated = False
    if llm_client.enabled:
        try:
            raw = await llm_client.complete_json(SYSTEM_PROMPT, messages)
        except LLMError as exc:
            logger.warning("Falha no LLM, caindo para modo simulado: %s", exc)
            raw = simulate(request.pet, request.message, evaluation, passages)
            simulated = True
    else:
        raw = simulate(request.pet, request.message, evaluation, passages)
        simulated = True

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
    )