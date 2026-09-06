"""Endpoints do motor de regras: alertas proativos e score de risco."""

from fastapi import APIRouter

from ..rules import evaluate_pet
from ..schemas import AlertsResponse, Pet

router = APIRouter(prefix="/api", tags=["alerts"])


@router.post("/alerts", response_model=AlertsResponse)
def alerts(pet: Pet) -> AlertsResponse:
    """Avalia um pet e devolve alertas + score de risco (0-100).

    É o que alimenta as notificações locais do app e o painel da clínica.
    Não usa LLM: saída determinística e auditável.
    """
    return evaluate_pet(pet)


@router.post("/alerts/batch", response_model=list[AlertsResponse])
def alerts_batch(pets: list[Pet]) -> list[AlertsResponse]:
    """Versão em lote, ordenada por risco — visão de carteira da clínica."""
    resultados = [evaluate_pet(pet) for pet in pets]
    resultados.sort(key=lambda r: r.riskScore, reverse=True)
    return resultados