"""Modo simulado: resposta determinística, sem chamar LLM externo.

Usado quando LLM_API_KEY não está configurado ou quando o provedor falha. A
resposta é montada a partir do motor de regras (fatos do pet) e do trecho mais
relevante recuperado pelo RAG. A API sinaliza esse modo no campo `simulated`,
para que a demonstração seja honesta sobre o que está gerando o texto.

As listas de termos também são usadas como guardrail em `routers/chat.py`:
mesmo com o LLM ativo, um relato com sinal de emergência tem a urgência elevada
no código, independentemente da classificação do modelo.
"""

from __future__ import annotations

import unicodedata

from .rag import Chunk
from .schemas import AlertsResponse, AlertSeverity, Pet, SuggestedAction, Urgency


def _fold(text: str) -> str:
    """Minúsculas e sem acento, para casar termos de forma tolerante."""
    text = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in text if not unicodedata.combining(c))


TERMOS_EMERGENCIA = [
    "convuls", "desmaio", "desmaiou", "sangra", "sangue", "veneno", "intoxic",
    "engasg", "nao respira", "dificuldade para respirar", "roxa", "atropel",
    "caiu da janela", "barriga inchada", "nao consegue urinar", "nao urina",
    "chocolate", "xilitol", "torcao", "prostrad", "nao levanta", "mucosa pal",
]

TERMOS_CONSULTA = [
    "vomit", "diarreia", "nao come", "nao quer comer", "sem comer", "come menos",
    "comendo menos", "comendo pouco", "sem apetite", "perdeu o apetite",
    "bebendo menos", "recusa", "tosse", "manca",
    "claudic", "coceira", "ferida", "secrecao", "febre", "muita sede", "emagrec",
    "apatic", "cansad",
]

TERMOS_MEDICACAO = [
    "posso dar", "pode tomar", "remedio", "medicamento", "dipirona",
    "paracetamol", "ibuprofeno", "anti-inflamatorio", "antibiotico", "dose",
]

TERMOS_VACINA = ["vacina", "reforco", "antirrabica", "v8", "v10", "carteira"]


def simulate(
    pet: Pet | None,
    message: str,
    evaluation: AlertsResponse | None,
    passages: list[tuple[Chunk, float]],
) -> dict:
    texto = _fold(message)
    nome = pet.name if pet else "seu pet"
    trecho = passages[0][0].text.split("\n", 1)[-1].strip() if passages else ""
    resumo = " ".join(trecho.split())[:320]

    if any(t in texto for t in TERMOS_EMERGENCIA):
        return {
            "reply": (
                f"O que você descreveu sobre {nome} é sinal de emergência. Procure "
                "atendimento veterinário agora, sem esperar melhora em casa e sem "
                f"medicar por conta própria. {resumo}"
            ),
            "urgency": Urgency.EMERGENCIA.value,
            "suggestedAction": SuggestedAction.PROCURAR_EMERGENCIA.value,
            "reason": "Relato contém termo da lista de sinais de emergência.",
        }

    if any(t in texto for t in TERMOS_MEDICACAO):
        return {
            "reply": (
                f"Não posso indicar medicamento nem dose para {nome}. Vários remédios "
                "de uso humano são tóxicos para cães e gatos, e a dose correta depende "
                "de peso, idade e do tratamento em curso — quem prescreve é o médico "
                f"veterinário. {resumo}"
            ),
            "urgency": Urgency.MEDIA.value,
            "suggestedAction": SuggestedAction.AGENDAR_CONSULTA.value,
            "reason": "Pedido de prescrição: fora do escopo do assistente.",
        }

    if any(t in texto for t in TERMOS_CONSULTA):
        return {
            "reply": (
                f"Esse sinal em {nome} merece avaliação. Se persistir por mais de 24 "
                "horas ou vier acompanhado de prostração, recusa de água ou piora, "
                "agende consulta. Registre no app o que você observou e desde quando, "
                f"para a clínica acompanhar a evolução. {resumo}"
            ),
            "urgency": Urgency.ALTA.value,
            "suggestedAction": SuggestedAction.AGENDAR_CONSULTA.value,
            "reason": "Sinal clínico com janela de 24 a 48 horas.",
        }

    if any(t in texto for t in TERMOS_VACINA) and evaluation:
        pendencias = [
            a for a in evaluation.alerts
            if a.code in ("VACINA_VENCIDA", "VACINA_PENDENTE", "SEM_VACINA_REGISTRADA")
        ]
        if pendencias:
            detalhes = " ".join(a.detail for a in pendencias[:2])
            return {
                "reply": (
                    f"A carteira de {nome} está com pendência. {detalhes} "
                    "Agende o reforço na clínica para manter a proteção em dia."
                ),
                "urgency": Urgency.MEDIA.value,
                "suggestedAction": SuggestedAction.ATUALIZAR_VACINA.value,
                "reason": "Motor de regras identificou pendência de vacinação.",
            }

    criticos = [
        a for a in (evaluation.alerts if evaluation else [])
        if a.severity == AlertSeverity.CRITICO
    ]
    complemento = f" Atenção: {criticos[0].detail}" if criticos else ""

    return {
        "reply": (
            f"Sobre {nome}: "
            f"{resumo or 'não encontrei material específico para essa dúvida no momento.'}"
            f"{complemento} Se aparecer qualquer sinal de piora, procure a clínica."
        ),
        "urgency": Urgency.BAIXA.value,
        "suggestedAction": SuggestedAction.CUIDADO_EM_CASA.value,
        "reason": "Dúvida informativa, sem sinal de alarme no relato.",
    }