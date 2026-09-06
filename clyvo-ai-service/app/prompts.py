"""Prompt de sistema do assistente e montagem do contexto enviado ao modelo.

Os guardrails ficam declarados aqui e são reforçados no código: `routers/chat.py`
eleva a urgência quando o relato contém sinal de emergência, independentemente
da classificação devolvida pelo LLM.
"""

from .schemas import AlertsResponse, Pet

SYSTEM_PROMPT = """\
Você é o assistente de saúde animal da CLYVO VET, dentro do aplicativo usado por \
tutores de pets. Você conversa em português do Brasil, em tom acolhedor, direto e \
sem jargão desnecessário.

O QUE VOCÊ FAZ
- Responde dúvidas sobre o cuidado do pet usando o contexto clínico fornecido.
- Faz triagem: classifica o nível de urgência do relato do tutor.
- Orienta o próximo passo concreto (observar em casa, agendar consulta, procurar \
emergência, atualizar vacina).
- Usa sempre o nome do pet e os dados reais dele. Se a pergunta já é respondida \
pelos dados (data de vacina, medicação em uso), responda com o dado.

O QUE VOCÊ NUNCA FAZ
- Nunca dá diagnóstico. Você não afirma qual é a doença do animal.
- Nunca prescreve medicamento, dose, via de administração ou duração de tratamento. \
Se perguntarem "posso dar X", explique o risco e encaminhe ao veterinário.
- Nunca contradiz ou desestimula orientação já dada pela clínica.
- Nunca inventa dado clínico que não esteja no contexto. Se falta informação, diga \
que falta e peça o registro no app.
- Nunca minimiza sinal de alarme. Na dúvida entre observar e encaminhar, encaminha.

FORMATO DA RESPOSTA
Responda SEMPRE com um único objeto JSON válido, sem texto antes ou depois e sem \
blocos de código markdown, com exatamente estas chaves:

{
  "reply": "texto da resposta ao tutor, 2 a 5 frases, em português",
  "urgency": "baixa" | "media" | "alta" | "emergencia",
  "suggestedAction": "nenhuma" | "cuidado_em_casa" | "agendar_consulta" | \
"atualizar_vacina" | "procurar_emergencia",
  "reason": "justificativa curta e técnica da classificação, para a clínica"
}

CRITÉRIO DE URGÊNCIA
- emergencia: risco de vida ou sinal da lista de emergência do material de apoio.
- alta: precisa de consulta em 24 a 48 horas.
- media: precisa de consulta, mas pode ser agendada na rotina.
- baixa: dúvida informativa ou situação de observação domiciliar.
"""


def build_pet_context(pet: Pet | None, evaluation: AlertsResponse | None) -> str:
    """Serializa o prontuário do pet em texto, para entrar no prompt."""
    if pet is None:
        return (
            "CONTEXTO DO PET\n"
            "Nenhum pet foi selecionado ou cadastrado. Responda de forma geral e "
            "convide o tutor a cadastrar o pet no app para receber orientação "
            "personalizada."
        )

    linhas = [
        "CONTEXTO DO PET",
        f"Nome: {pet.name}",
        f"Espécie: {pet.species or 'não informada'}",
        f"Raça: {pet.breed or 'não informada'}",
        f"Idade: {pet.age or 'não informada'}",
        f"Peso: {pet.weight or 'não informado'}",
        f"Próximo check-up: {pet.nextCheckup or 'não agendado'}",
        "",
        "Carteira de vacinação:",
    ]

    if pet.vaccines:
        for v in pet.vaccines:
            status = "aplicada" if v.done else "PENDENTE"
            linhas.append(
                f"- {v.name}: {status}; aplicada em {v.date or 'sem data'}; "
                f"próximo reforço em {v.nextDue or 'sem data'}"
            )
    else:
        linhas.append("- nenhuma vacina registrada no app")

    linhas += ["", "Medicações:"]
    ativas = [m for m in pet.medications if m.active]
    if ativas:
        for m in ativas:
            linhas.append(
                f"- {m.name} {m.dosage}, {m.frequency}, de {m.startDate or '?'} "
                f"até {m.endDate or 'sem previsão'} (EM USO)"
            )
    else:
        linhas.append("- nenhuma medicação ativa registrada")

    if evaluation:
        linhas += [
            "",
            f"SCORE DE RISCO (motor de regras): {evaluation.riskScore}/100 "
            f"({evaluation.riskLabel})",
        ]
        if evaluation.alerts:
            linhas.append("Alertas abertos:")
            linhas += [
                f"- [{a.severity.value}] {a.title}: {a.detail}" for a in evaluation.alerts
            ]

    return "\n".join(linhas)


def build_knowledge_context(passages: list[tuple[str, str]]) -> str:
    """`passages` é uma lista de (título, texto) devolvida pelo RAG."""
    if not passages:
        return ""
    blocos = [f"### {titulo}\n{texto}" for titulo, texto in passages]
    return (
        "MATERIAL DE APOIO VETERINÁRIO (use como referência; não cite os títulos "
        "literalmente para o tutor)\n\n" + "\n\n".join(blocos)
    )