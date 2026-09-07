from datetime import date, datetime
from .schemas import Alert, AlertSeverity, AlertsResponse, Pet

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

    if not value:
        return None

    raw = str(value).strip()

    formatos = (
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%fZ",
    )

    for fmt in formatos:
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(
            raw.replace("Z", "+00:00")
        ).date()
    except ValueError:
        return None


def _parse_age_years(
    age: int | float | str | None,
) -> float | None:


    if age is None:
        return None

    if isinstance(age, (int, float)):
        return float(age)

    raw_age = str(age).strip()

    if not raw_age:
        return None


    raw_age = raw_age.replace(",", ".")

    partes = "".join(
        c if c.isdigit() or c == "." else " "
        for c in raw_age
    ).split()

    if not partes:
        return None

    try:
        value = float(partes[0])
    except ValueError:
        return None

    if "mes" in raw_age.lower():
        return value / 12

    return value


def _fmt(d: date) -> str:

    return d.strftime("%d/%m/%Y")


def evaluate_pet(
    pet: Pet,
    today: date | None = None,
) -> AlertsResponse:


    today = today or date.today()

    alerts: list[Alert] = []


    if not pet.vaccines:
        alerts.append(
            Alert(
                code="SEM_VACINA_REGISTRADA",
                severity=AlertSeverity.ATENCAO,
                title="Nenhuma vacina registrada",
                detail=(
                    f"{pet.name} não possui carteira de vacinação no app. "
                    "Sem esse histórico não é possível acompanhar "
                    "adequadamente a proteção do pet."
                ),
            )
        )

    for vaccine in pet.vaccines:

        due = _parse(vaccine.nextDue)

  
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
                    dueDate=vaccine.nextDue or None,
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
                        f"O reforço de {vaccine.name} venceu em "
                        f"{_fmt(due)} "
                        f"({abs(dias)} dias de atraso)."
                    ),
                    dueDate=vaccine.nextDue,
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
                    dueDate=vaccine.nextDue,
                )
            )


    for med in pet.medications:
        if not med.active:
            continue


        fim = _parse(med.endDate)

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
                dueDate=med.endDate or None,
            )
        )


        if fim and 0 <= (fim - today).days <= 3:
            alerts.append(
                Alert(
                    code="MEDICACAO_ENCERRANDO",
                    severity=AlertSeverity.ATENCAO,
                    title=f"Fim de tratamento: {med.name}",
                    detail=(
                        f"O tratamento com {med.name} termina em "
                        f"{_fmt(fim)}. Confirme com a clínica se há "
                        "necessidade de retorno ou reavaliação."
                    ),
                    dueDate=med.endDate,
                )
            )



    checkup = _parse(pet.nextCheckup)

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
                    dueDate=pet.nextCheckup,
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
                    dueDate=pet.nextCheckup,
                )
            )


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
                    "geriátrica considerada para a espécie. "
                    "Acompanhamento periódico mais frequente "
                    "pode ser recomendado nessa fase."
                ),
            )
        )

    score = min(
        100,
        sum(
            RISK_WEIGHTS.get(alert.code, 0)
            for alert in alerts
        ),
    )

    if score < 30:
        label = "baixo"
    elif score < 60:
        label = "medio"
    else:
        label = "alto"

    ordem = {
        AlertSeverity.CRITICO: 0,
        AlertSeverity.ATENCAO: 1,
        AlertSeverity.INFO: 2,
    }

    alerts.sort(
        key=lambda alert: ordem[alert.severity]
    )

    # -----------------------------------------------------------------------
    # Resposta
    # -----------------------------------------------------------------------

    return AlertsResponse(
        petId=pet.id,
        petName=pet.name,
        riskScore=score,
        riskLabel=label,
        alerts=alerts,
    )