"""Contratos de entrada e saída da API.

Os modelos de domínio espelham `src/types/index.ts` do app mobile, para que o
payload enviado pelo React Native seja aceito sem transformação.
"""

from enum import Enum
from typing import Annotated, Any, Callable, Literal

from pydantic import BaseModel, BeforeValidator, Field


# --------------------------------------------------------------------------- #
# Coerção tolerante (dados reais do Firebase/AsyncStorage)
# --------------------------------------------------------------------------- #
# O app pode enviar campos opcionais como null, números onde o schema espera
# texto, ou listas como null. Em vez de recusar (422), normalizamos na entrada.
def _as_str(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, bool):
        return "sim" if v else "nao"
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def _as_list(v: Any) -> list:
    if v is None:
        return []
    if isinstance(v, list):
        return v
    return [v]


def _as_bool(default: bool) -> Callable[[Any], bool]:
    def coerce(v: Any) -> bool:
        if v is None:
            return default
        if isinstance(v, str):
            return v.strip().lower() in {"1", "true", "sim", "yes", "y", "t"}
        return bool(v)

    return coerce


def _as_role(v: Any) -> str:
    return v if v in ("user", "assistant") else "user"


Str = Annotated[str, BeforeValidator(_as_str)]
Lista = BeforeValidator(_as_list)


# --------------------------------------------------------------------------- #
# Domínio (espelho do app mobile)
# --------------------------------------------------------------------------- #
class Vaccine(BaseModel):
    id: Str = ""
    name: Str = ""
    date: Str = ""
    nextDue: Str = ""
    done: Annotated[bool, BeforeValidator(_as_bool(False))] = False


class Medication(BaseModel):
    id: Str = ""
    name: Str = ""
    dosage: Str = ""
    frequency: Str = ""
    startDate: Str = ""
    endDate: Str = ""
    active: Annotated[bool, BeforeValidator(_as_bool(True))] = True


class Pet(BaseModel):
    id: Str = ""
    name: Str = ""
    species: Str = ""
    breed: Str = ""
    age: Str = ""
    weight: Str = ""
    color: Str = ""
    ownerId: Str = ""
    vaccines: Annotated[list[Vaccine], Lista] = Field(default_factory=list)
    medications: Annotated[list[Medication], Lista] = Field(default_factory=list)
    nextCheckup: Str = ""
    createdAt: Str = ""


class ChatMessage(BaseModel):
    role: Annotated[Literal["user", "assistant"], BeforeValidator(_as_role)] = "user"
    content: Str = ""


# --------------------------------------------------------------------------- #
# Motor de regras
# --------------------------------------------------------------------------- #
class AlertSeverity(str, Enum):
    INFO = "info"
    ATENCAO = "atencao"
    CRITICO = "critico"


class Alert(BaseModel):
    code: str
    severity: AlertSeverity
    title: str
    detail: str
    dueDate: str | None = None


class AlertsResponse(BaseModel):
    petId: str
    petName: str
    riskScore: int = Field(ge=0, le=100, description="0 = sem risco, 100 = risco máximo")
    riskLabel: Literal["baixo", "medio", "alto"]
    alerts: list[Alert]


# --------------------------------------------------------------------------- #
# Chat
# --------------------------------------------------------------------------- #
class Urgency(str, Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    EMERGENCIA = "emergencia"


class SuggestedAction(str, Enum):
    NENHUMA = "nenhuma"
    CUIDADO_EM_CASA = "cuidado_em_casa"
    AGENDAR_CONSULTA = "agendar_consulta"
    ATUALIZAR_VACINA = "atualizar_vacina"
    PROCURAR_EMERGENCIA = "procurar_emergencia"


class ChatRequest(BaseModel):
    pet: Pet | None = None
    petId: str | None = None
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


class ChatResponse(BaseModel):
    reply: str
    urgency: Urgency
    suggestedAction: SuggestedAction
    reason: str = ""
    sources: list[str] = Field(default_factory=list)
    alerts: list[Alert] = Field(default_factory=list)
    simulated: bool = False


# --------------------------------------------------------------------------- #
# RPA de notificações
# --------------------------------------------------------------------------- #
class RpaInscricaoRequest(BaseModel):
    pet: Pet
    tutorNome: str = ""
    tutorEmail: str


class RpaItem(BaseModel):
    petId: str
    petName: str
    destino: str
    riskScore: int
    alertas: list[str] = Field(default_factory=list)
    status: str
    detalhe: str = ""
    assunto: str = ""


class RpaExecucao(BaseModel):
    data: str
    total: int
    enviados: int
    ignorados: int
    falhas: int
    itens: list[RpaItem] = Field(default_factory=list)


class RpaStatus(BaseModel):
    enabled: bool
    schedule: str
    emailProvider: str
    petsMonitorados: int
    ultimaExecucao: str | None = None
    ultimosEnvios: list[dict] = Field(default_factory=list)