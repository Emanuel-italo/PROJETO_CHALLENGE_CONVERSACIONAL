
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