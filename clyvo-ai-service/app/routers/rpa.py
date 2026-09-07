"""Endpoints de controle do RPA de notificações."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Header, HTTPException, Response

from ..config import settings
from ..rpa import carteira, job, scheduler
from ..schemas import RpaExecucao, RpaInscricaoRequest, RpaItem, RpaStatus

router = APIRouter(prefix="/api/rpa", tags=["rpa"])


def _autorizar(token: str | None) -> None:
    if token != settings.rpa_token:
        raise HTTPException(status_code=401, detail="Token do RPA inválido.")


@router.get("/status", response_model=RpaStatus)
def status() -> RpaStatus:
    """Estado da rotina: agendamento, provedor de e-mail e últimos envios."""
    inscricoes = carteira.listar()

    return RpaStatus(
        enabled=settings.rpa_enabled,
        schedule=f"{settings.rpa_hour:02d}:{settings.rpa_minute:02d} {settings.rpa_timezone}",
        emailProvider="console (simulado)"
        if settings.rpa_dry_run or settings.email_provider == "console"
        else settings.email_provider,
        petsMonitorados=len(inscricoes),
        ultimaExecucao=scheduler.ultima_execucao(),
        ultimosEnvios=carteira.historico(10),
    )


@router.post("/run", response_model=RpaExecucao)
def run(
    forcar: bool = False,
    x_rpa_token: str | None = Header(default=None, alias="X-RPA-Token"),
) -> RpaExecucao:
    """Dispara a rotina agora.

    É o mesmo código do agendamento diário. Serve para o cron externo e para
    demonstrar a execução no vídeo sem esperar o horário.
    """
    _autorizar(x_rpa_token)

    resultado = job.executar(forcar=forcar)

    return RpaExecucao(
        data=resultado.data,
        total=resultado.total,
        enviados=resultado.enviados,
        ignorados=resultado.ignorados,
        falhas=resultado.falhas,
        # O HTML completo do preview não volta no run: só o resumo do envio.
        itens=[
            RpaItem(**{**item.__dict__, "detalhe": item.detalhe[:200]})
            for item in resultado.itens
        ],
    )


@router.get("/preview", response_class=Response)
def preview(
    petId: str,
    x_rpa_token: str | None = Header(default=None, alias="X-RPA-Token"),
) -> Response:
    """Devolve o HTML do e-mail daquele pet, sem enviar nada."""
    _autorizar(x_rpa_token)

    resultado = job.executar(apenas_preview=True)

    for item in resultado.itens:
        if item.petId == petId and item.detalhe:
            return Response(content=item.detalhe, media_type="text/html")

    raise HTTPException(
        status_code=404,
        detail="Pet não encontrado na carteira ou sem pendência a notificar.",
    )


@router.post("/pets", response_model=RpaStatus)
def inscrever(
    request: RpaInscricaoRequest,
    x_rpa_token: str | None = Header(default=None, alias="X-RPA-Token"),
) -> RpaStatus:
    """Inscreve ou atualiza um pet na carteira monitorada.

    É por aqui que o aplicativo mantém o RPA em dia com os dados reais do tutor.
    """
    _autorizar(x_rpa_token)

    carteira.salvar(
        carteira.Inscricao(
            pet=request.pet,
            tutor_nome=request.tutorNome,
            tutor_email=request.tutorEmail,
        ),
        quando=date.today().isoformat(),
    )

    return status()
