"""Montagem do e-mail enviado ao tutor."""

from __future__ import annotations

from .schemas import Alert, AlertSeverity, AlertsResponse, Pet

CORES = {
    AlertSeverity.CRITICO: "#B42318",
    AlertSeverity.ATENCAO: "#A96504",
    AlertSeverity.INFO: "#1A6EBD",
}

ROTULO = {
    AlertSeverity.CRITICO: "Ação necessária",
    AlertSeverity.ATENCAO: "Atenção",
    AlertSeverity.INFO: "Lembrete",
}


def montar_assunto(pet: Pet, avaliacao: AlertsResponse) -> str:
    criticos = [a for a in avaliacao.alerts if a.severity == AlertSeverity.CRITICO]

    if criticos:
        return f"{pet.name}: {criticos[0].title.lower()}"

    atencao = [a for a in avaliacao.alerts if a.severity == AlertSeverity.ATENCAO]

    if atencao:
        return f"{pet.name}: {atencao[0].title.lower()}"

    return f"Lembrete de saúde da {pet.name}"


def montar_texto(pet: Pet, tutor: str, avaliacao: AlertsResponse) -> str:
    linhas = [
        f"Olá{', ' + tutor if tutor else ''}!",
        "",
        f"Passando para lembrar do cuidado com {pet.name} "
        f"({pet.species}{', ' + pet.breed if pet.breed else ''}).",
        "",
        f"Situação atual: risco {avaliacao.riskLabel} ({avaliacao.riskScore}/100).",
        "",
        "O que precisa da sua atenção:",
    ]

    for alerta in avaliacao.alerts:
        linhas.append(f"- [{ROTULO[alerta.severity]}] {alerta.title}: {alerta.detail}")

    linhas += [
        "",
        "Agende pelo aplicativo Clyvo Vet ou responda este e-mail para falar com a clínica.",
        "",
        "Equipe Clyvo Vet",
        "Este é um lembrete automático. Ele não substitui avaliação veterinária.",
    ]

    return "\n".join(linhas)


def _bloco_alerta(alerta: Alert) -> str:
    cor = CORES[alerta.severity]

    return f"""
      <tr>
        <td style="padding:0 0 12px 0;">
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border-left:4px solid {cor};background:#F7F9FC;border-radius:8px;">
            <tr>
              <td style="padding:14px 16px;">
                <div style="font:700 11px/1.2 Arial,sans-serif;color:{cor};
                            letter-spacing:.8px;text-transform:uppercase;">
                  {ROTULO[alerta.severity]}
                </div>
                <div style="font:700 15px/1.4 Arial,sans-serif;color:#0A1628;margin-top:6px;">
                  {alerta.title}
                </div>
                <div style="font:400 13px/1.6 Arial,sans-serif;color:#4A5568;margin-top:4px;">
                  {alerta.detail}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    """


def montar_html(pet: Pet, tutor: str, avaliacao: AlertsResponse) -> str:
    cor_risco = (
        "#B42318"
        if avaliacao.riskScore >= 60
        else "#A96504" if avaliacao.riskScore >= 30 else "#2ECC71"
    )

    alertas = "".join(_bloco_alerta(alerta) for alerta in avaliacao.alerts)
    saudacao = f"Olá, {tutor}!" if tutor else "Olá!"

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#F0F4F8;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;">

        <tr>
          <td style="background:#0A1628;padding:22px 24px;">
            <div style="font:900 11px/1 Arial,sans-serif;color:#4A9EFF;letter-spacing:2px;">
              CLYVO VET
            </div>
            <div style="font:700 20px/1.3 Arial,sans-serif;color:#FFFFFF;margin-top:8px;">
              A saúde de {pet.name} precisa de você
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:24px;">
            <p style="font:400 15px/1.6 Arial,sans-serif;color:#0A1628;margin:0 0 6px 0;">
              {saudacao}
            </p>
            <p style="font:400 14px/1.6 Arial,sans-serif;color:#4A5568;margin:0 0 18px 0;">
              Revisamos o histórico de <strong>{pet.name}</strong>
              ({pet.species}{', ' + pet.breed if pet.breed else ''}, {pet.age})
              e encontramos pendências na jornada de cuidado.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#F7F9FC;border-radius:10px;margin-bottom:20px;">
              <tr>
                <td style="padding:14px 16px;">
                  <div style="font:700 11px/1 Arial,sans-serif;color:#4A5568;letter-spacing:1px;">
                    ÍNDICE DE RISCO
                  </div>
                  <div style="font:900 26px/1.2 Arial,sans-serif;color:{cor_risco};margin-top:6px;">
                    {avaliacao.riskScore}<span style="font-size:14px;color:#A0AEC0;">/100</span>
                    <span style="font-size:13px;color:{cor_risco};text-transform:uppercase;">
                      &nbsp;{avaliacao.riskLabel}
                    </span>
                  </div>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">{alertas}</table>

            <p style="font:400 13px/1.6 Arial,sans-serif;color:#4A5568;margin:18px 0 0 0;">
              Abra o aplicativo Clyvo Vet para agendar, ou responda este e-mail
              para falar com a clínica.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#F7F9FC;padding:16px 24px;">
            <p style="font:400 11px/1.6 Arial,sans-serif;color:#A0AEC0;margin:0;">
              Lembrete automático gerado pela rotina de acompanhamento da Clyvo Vet.
              Não substitui avaliação do médico veterinário.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""
