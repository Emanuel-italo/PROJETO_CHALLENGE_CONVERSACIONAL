"""Contratos de entrada e saída da API.

Os modelos de domínio espelham `src/types/index.ts` do app mobile, para que o
payload enviado pelo React Native seja aceito sem transformação.
"""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# --------------------------------------------------------------------------- #
# Domínio (espelho do app mobile)
# --------------------------------------------------------------------------- #

class Vaccine(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = ""
    name: str
    date: str = ""
    next_due: str = Field(
        default="",
        alias="nextDue",
    )
    done: bool = False


class Medication(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = ""
    name: str
    dosage: str = ""
    frequency: str = ""
    start_date: str = Field(
        default="",
        alias="startDate",
    )
    end_date: str = Field(
        default="",
        alias="endDate",
    )
    active: bool = True


class Pet(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = ""
    name: str
    species: str = ""
    breed: str = ""

    # O aplicativo envia esses campos como números.
    # Mantemos compatibilidade com dados antigos que possam estar como texto.
    age: int | float | str = ""
    weight: int | float | str = ""

    color: str = ""

    owner_id: str = Field(
        default="",
        alias="ownerId",
    )

    vaccines: list[Vaccine] = Field(
        default_factory=list,
    )

    medications: list[Medication] = Field(
        default_factory=list,
    )

    next_checkup: str = Field(
        default="",
        alias="nextCheckup",
    )

    created_at: str = Field(
        default="",
        alias="createdAt",
    )


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


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
    riskScore: int = Field(
        ge=0,
        le=100,
        description="0 = sem risco, 100 = risco máximo",
    )
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

    message: str = Field(
        min_length=1,
        max_length=2000,
    )

    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=20,
    )


class ChatResponse(BaseModel):
    reply: str
    urgency: Urgency
    suggestedAction: SuggestedAction
    reason: str = ""
    sources: list[str] = Field(
        default_factory=list,
    )
    alerts: list[Alert] = Field(
        default_factory=list,
    )
    simulated: bool = False