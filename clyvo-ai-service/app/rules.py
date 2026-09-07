
"""Motor de regras determinístico da jornada de saúde.

O que é crítico (vacina vencida, medicação em curso, retorno atrasado) NÃO passa
pelo LLM: é calculado aqui, de forma auditável e reproduzível. O LLM apenas
recebe esse resultado como contexto e o traduz em linguagem natural.
"""

from datetime import date, datetime

from .schemas import Alert, AlertSeverity, AlertsResponse, Pet


# Pesos de risco por código de alerta (somados e limitados a 100)
RISK_WEIGHTS: dict[str, int] = {
    "VACINA_VENCIDA": 30,
    "VACINA_A_VENCER": 12,
    "VACINA_PENDENTE": 20,
    "SEM_VACINA_REGISTRADA": 25,
    "MEDICACAO_ATIVA": 10,
    "MEDICACAO_ENCERRANDO": 8,
    "CHECKUP_ATRASADO": 20,
    "CHECKUP_PROXIMO": 5,
    "PET_IDOSO": 15,
}

DIAS_ALERTA_ANTECIPADO = 30


def _parse(value: str | None) -> date | None:
    """Aceita ISO, formato BR e ISO com horário."""
    if not value:
        return None

    raw = str(value).strip()

    for fmt in (
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%fZ",
    ):
        try:
            return datetime.strptime(raw[: len(fmt) + 6], fmt).date()
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(
            raw.replace("Z", "+00:00")
        ).date()
    except ValueError:
        return None


def _parse_age_years(age: int | float | str | None) -> float | None:
    """
    Extrai a idade em anos.

    Aceita:
    - 3
    - 3.5
    - "3"
    - "3 anos"
    - "36 meses"
    """

    if age is None:
        return None

    # Caso o aplicativo envie diretamente um número.
    if isinstance(age, (int, float)):
        return float(age)

    raw_age = str(age).strip()

    if not raw_age:
        return None

    digits = (
        "".join(
            c if c.isdigit() or c == "." else " "
            for c in raw_age
        )
        .split()
    )

    if not digits:
        return None

    try:
        value = float(digits[0])
    except ValueError:
        return None

    if "mes" in raw_age.lower():
        return value / 12

    return value


def _fmt(d: date) -> str:
    """Formata uma data para o padrão brasileiro."""
    return d.strftime("%d/%m/%Y")


def evaluate_pet(
    pet: Pet,
    today: date | None = None,
) -> AlertsResponse:
    """Aplica todas as regras e devolve alertas + score de risco (0-100)."""

    today = today or date.today()
    alerts: list[Alert] = []

    # ---------------------------- Vacinação ---------------------------------

    if not pet.vaccines:
        alerts.append(
            Alert(
                code="SEM_VACINA_REGISTRADA",
                severity=AlertSeverity.ATENCAO,
                title="Nenhuma vacina registrada",
                detail=(
                    f"{pet.name} não possui carteira de vacinação no app. "
                    "Sem esse histórico não é possível acompanhar a proteção do pet."
                ),
            )
        )

    for vaccine in pet.vaccines:

        # CORREÇÃO:
        # O atributo Python é next_due.
        # nextDue é apenas o alias usado no JSON.
        due = _parse(vaccine.next_due)

        if not vaccine.done:
            alerts.append(
                Alert(
                    code="VACINA_PENDENTE",
                    severity=AlertSeverity.ATENCAO,
                    title=f"Vacina pendente: {vaccine.name}",
                    detail=(
                        f"A dose de {vaccine.name} ainda não foi "
                        "marcada como aplicada."
                    ),
                    dueDate=vaccine.next_due or None,
                )
            )
            continue

        if due is None:
            continue

        dias = (due - today).days

        if dias < 0:
            alerts.append(
                Alert(
                    code="VACINA_VENCIDA",
                    severity=AlertSeverity.CRITICO,
                    title=f"Vacina vencida: {vaccine.name}",
                    detail=(
                        f"O reforço de {vaccine.name} venceu em {_fmt(due)} "
                        f"({abs(dias)} dias de atraso)."
                    ),
                    dueDate=vaccine.next_due,
                )
            )

        elif dias <= DIAS_ALERTA_ANTECIPADO:
            alerts.append(
                Alert(
                    code="VACINA_A_VENCER",
                    severity=AlertSeverity.INFO,
                    title=f"Reforço próximo: {vaccine.name}",
                    detail=(
                        f"O reforço de {vaccine.name} vence em "
                        f"{dias} dias ({_fmt(due)})."
                    ),
                    dueDate=vaccine.next_due,
                )
            )

    # ---------------------------- Medicação ---------------------------------

    for med in pet.medications:

        if not med.active:
            continue

        # CORREÇÃO:
        # O atributo Python é end_date.
        # endDate é apenas o alias usado no JSON.
        fim = _parse(med.end_date)

        alerts.append(
            Alert(
                code="MEDICACAO_ATIVA",
                severity=AlertSeverity.INFO,
                title=f"Tratamento em curso: {med.name}",
                detail=(
                    f"{med.name} {med.dosage} — {med.frequency}."
                    + (
                        f" Término previsto em {_fmt(fim)}."
                        if fim
                        else ""
                    )
                ),
                dueDate=med.end_date or None,
            )
        )

        if fim and 0 <= (fim - today).days <= 3:
            alerts.append(
                Alert(
                    code="MEDICACAO_ENCERRANDO",
                    severity=AlertSeverity.ATENCAO,
                    title=f"Fim de tratamento: {med.name}",
                    detail=(
                        f"O tratamento com {med.name} termina em {_fmt(fim)}. "
                        "Confirme com a clínica se há necessidade de retorno "
                        "ou reavaliação."
                    ),
                    dueDate=med.end_date,
                )
            )

    # ---------------------------- Check-up ----------------------------------

    # CORREÇÃO:
    # O atributo Python é next_checkup.
    # nextCheckup é apenas o alias usado no JSON.
    checkup = _parse(pet.next_checkup)

    if checkup:

        dias = (checkup - today).days

        if dias < 0:
            alerts.append(
                Alert(
                    code="CHECKUP_ATRASADO",
                    severity=AlertSeverity.CRITICO,
                    title="Check-up atrasado",
                    detail=(
                        f"O check-up estava previsto para {_fmt(checkup)} "
                        f"e está {abs(dias)} dias atrasado."
                    ),
                    dueDate=pet.next_checkup,
                )
            )

        elif dias <= DIAS_ALERTA_ANTECIPADO:
            alerts.append(
                Alert(
                    code="CHECKUP_PROXIMO",
                    severity=AlertSeverity.INFO,
                    title="Check-up se aproximando",
                    detail=(
                        f"Check-up previsto para {_fmt(checkup)} "
                        f"(em {dias} dias)."
                    ),
                    dueDate=pet.next_checkup,
                )
            )

    # ------------------------- Faixa etária ---------------------------------

    idade = _parse_age_years(pet.age)

    especie = (pet.species or "").strip().lower()

    limite_idoso = (
        7
        if especie.startswith("cach")
        or especie.startswith("dog")
        else 10
    )

    if idade is not None and idade >= limite_idoso:
        alerts.append(
            Alert(
                code="PET_IDOSO",
                severity=AlertSeverity.ATENCAO,
                title="Pet em fase geriátrica",
                detail=(
                    f"{pet.name} tem {pet.age} anos e entra na faixa "
                    "geriátrica para a espécie. Acompanhamento semestral "
                    "é recomendado nessa fase."
                ),
            )
        )

    # ------------------------------ Score -----------------------------------

    score = min(
        100,
        sum(
            RISK_WEIGHTS.get(alert.code, 0)
            for alert in alerts
        ),
    )

    label = (
        "baixo"
        if score < 30
        else "medio"
        if score < 60
        else "alto"
    )

    ordem = {
        AlertSeverity.CRITICO: 0,
        AlertSeverity.ATENCAO: 1,
        AlertSeverity.INFO: 2,
    }

    alerts.sort(
        key=lambda alert: ordem[alert.severity]
    )

    return AlertsResponse(
        petId=pet.id,
        petName=pet.name,
        riskScore=score,
        riskLabel=label,
        alerts=alerts,
    )