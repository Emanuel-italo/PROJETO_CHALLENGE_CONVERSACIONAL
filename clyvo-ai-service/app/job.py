"""Rotina do RPA: varre a carteira, aplica as regras e notifica o tutor."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import date

from .rules import evaluate_pet
from .schemas import AlertSeverity
from . import carteira, templates
from .mailer import EmailError, enviar

logger = logging.getLogger(__name__)

# Só gera e-mail o alerta que exige ação do tutor. "Medicação em curso" é
# informativo e sozinho não justifica notificação.
CODIGOS_NOTIFICAVEIS = {
    "VACINA_VENCIDA",
    "VACINA_A_VENCER",
    "VACINA_PENDENTE",
    "SEM_VACINA_REGISTRADA",
    "CHECKUP_ATRASADO",
    "CHECKUP_PROXIMO",
    "MEDICACAO_ENCERRANDO",
}


@dataclass
class ResultadoPet:
    petId: str
    petName: str
    destino: str
    riskScore: int
    alertas: list[str] = field(default_factory=list)
    status: str = "ignorado"
    detalhe: str = ""
    assunto: str = ""


@dataclass
class ResultadoExecucao:
    data: str
    total: int = 0
    enviados: int = 0
    ignorados: int = 0
    falhas: int = 0
    itens: list[ResultadoPet] = field(default_factory=list)


def executar(
    hoje: date | None = None,
    forcar: bool = False,
    apenas_preview: bool = False,
) -> ResultadoExecucao:
    """Executa a varredura.

    `forcar` ignora a trava de um envio por pet por dia.
    `apenas_preview` monta o e-mail sem enviar, para inspeção via API.
    """
    hoje = hoje or date.today()
    dia = hoje.isoformat()

    resultado = ResultadoExecucao(data=dia)

    for inscricao in carteira.listar():
        pet = inscricao.pet
        resultado.total += 1

        avaliacao = evaluate_pet(pet, today=hoje)

        acionaveis = [
            alerta
            for alerta in avaliacao.alerts
            if alerta.code in CODIGOS_NOTIFICAVEIS
            and alerta.severity in (AlertSeverity.CRITICO, AlertSeverity.ATENCAO, AlertSeverity.INFO)
        ]

        item = ResultadoPet(
            petId=pet.id,
            petName=pet.name,
            destino=inscricao.tutor_email,
            riskScore=avaliacao.riskScore,
            alertas=[alerta.code for alerta in acionaveis],
        )

        if not acionaveis:
            item.status = "sem_pendencia"
            resultado.ignorados += 1
            resultado.itens.append(item)
            continue

        if not forcar and not apenas_preview and carteira.ja_enviado_hoje(pet.id, dia):
            item.status = "ja_enviado_hoje"
            resultado.ignorados += 1
            resultado.itens.append(item)
            continue

        # Só os alertas acionáveis entram no e-mail.
        avaliacao_email = avaliacao.model_copy(update={"alerts": acionaveis})

        assunto = templates.montar_assunto(pet, avaliacao_email)
        html = templates.montar_html(pet, inscricao.tutor_nome, avaliacao_email)
        texto = templates.montar_texto(pet, inscricao.tutor_nome, avaliacao_email)

        item.assunto = assunto

        if apenas_preview:
            item.status = "preview"
            item.detalhe = html
            resultado.itens.append(item)
            continue

        try:
            provedor = enviar(inscricao.tutor_email, assunto, html, texto)
            item.status = "enviado"
            item.detalhe = f"provedor={provedor}"
            resultado.enviados += 1
        except EmailError as exc:
            item.status = "falha"
            item.detalhe = str(exc)
            resultado.falhas += 1
            logger.error("[RPA] falha ao notificar %s: %s", pet.name, exc)

        carteira.registrar_envio(
            pet_id=pet.id,
            destino=inscricao.tutor_email,
            data=dia,
            assunto=assunto,
            alertas=item.alertas,
            status=item.status,
            detalhe=item.detalhe,
        )

        resultado.itens.append(item)

    logger.info(
        "[RPA] execução %s: %s pets, %s enviados, %s ignorados, %s falhas",
        dia,
        resultado.total,
        resultado.enviados,
        resultado.ignorados,
        resultado.falhas,
    )

    return resultado
