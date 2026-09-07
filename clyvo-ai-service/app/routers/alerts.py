from fastapi import APIRouter
from ..rules import evaluate_pet
from ..schemas import AlertsResponse, Pet

router = APIRouter(prefix="/api", tags=["alerts"])

@router.post("/alerts", response_model=AlertsResponse)
def alerts(pet: Pet) -> AlertsResponse:

    return evaluate_pet(pet)


@router.post("/alerts/batch", response_model=list[AlertsResponse])
def alerts_batch(pets: list[Pet]) -> list[AlertsResponse]:

    resultados = [evaluate_pet(pet) for pet in pets]
    resultados.sort(key=lambda r: r.riskScore, reverse=True)
    return resultados