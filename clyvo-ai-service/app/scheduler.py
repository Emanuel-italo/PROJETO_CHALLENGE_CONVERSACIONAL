"""Agendador diário do RPA, sem dependência externa.

Uma task asyncio dorme até o próximo horário configurado (fuso de São Paulo) e
dispara a rotina. Em hospedagem que hiberna o serviço por inatividade, use
também o disparo HTTP (`POST /api/rpa/run`) a partir de um cron externo — os
dois caminhos chamam a mesma função `job.executar`.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from .config import settings
from . import job

logger = logging.getLogger(__name__)

_tarefa: asyncio.Task | None = None
_ultima_execucao: str | None = None


def ultima_execucao() -> str | None:
    return _ultima_execucao


def _proximo_disparo(agora: datetime) -> datetime:
    alvo = agora.replace(
        hour=settings.rpa_hour, minute=settings.rpa_minute, second=0, microsecond=0
    )

    if alvo <= agora:
        alvo += timedelta(days=1)

    return alvo


async def _laco() -> None:
    fuso = ZoneInfo(settings.rpa_timezone)

    while True:
        agora = datetime.now(fuso)
        alvo = _proximo_disparo(agora)
        espera = (alvo - agora).total_seconds()

        logger.info(
            "[RPA] próxima execução em %s (%s minutos)",
            alvo.strftime("%d/%m/%Y %H:%M"),
            int(espera // 60),
        )

        try:
            await asyncio.sleep(espera)
        except asyncio.CancelledError:
            raise

        try:
            global _ultima_execucao
            resultado = await asyncio.to_thread(job.executar)
            _ultima_execucao = datetime.now(fuso).isoformat(timespec="seconds")
            logger.info("[RPA] concluído: %s e-mails enviados", resultado.enviados)
        except Exception:  # nunca derruba o agendador
            logger.exception("[RPA] erro na execução agendada")


def iniciar() -> None:
    global _tarefa

    if not settings.rpa_enabled:
        logger.info("[RPA] desabilitado por configuração (RPA_ENABLED=false)")
        return

    if _tarefa and not _tarefa.done():
        return

    _tarefa = asyncio.create_task(_laco())
    logger.info(
        "[RPA] agendador ativo — disparo diário às %02d:%02d (%s)",
        settings.rpa_hour,
        settings.rpa_minute,
        settings.rpa_timezone,
    )


async def parar() -> None:
    global _tarefa

    if _tarefa and not _tarefa.done():
        _tarefa.cancel()
        try:
            await _tarefa
        except asyncio.CancelledError:
            pass

    _tarefa = None
