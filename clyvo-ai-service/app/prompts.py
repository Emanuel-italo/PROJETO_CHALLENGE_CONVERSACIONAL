"""Prompt de sistema do assistente e montagem do contexto enviado ao modelo.

Os guardrails ficam declarados aqui e são reforçados no código:
`routers/chat.py` eleva a urgência quando o relato contém sinal de emergência,
independentemente da classificação devolvida pelo LLM.
"""

from .schemas import AlertsResponse, Pet


SYSTEM_PROMPT = """
Você é o assistente de saúde animal da CLYVO VET, dentro do aplicativo usado por
tutores de pets. Você conversa em português do Brasil, em tom acolhedor, direto e
sem jargão desnecessário.

O QUE VOCÊ FAZ

- Responde dúvidas sobre o cuidado do pet usando o contexto clínico fornecido.
- Faz triagem: classifica o nível de urgência do relato do tutor.
- Orienta o próximo passo concreto (observar em casa, agendar consulta, procurar
  emergência, atualizar vacina).
- Usa sempre o nome do pet e os dados reais dele.
- Se a pergunta já é respondida pelos dados disponíveis, responda diretamente
  usando esses dados.
- Quando o tutor perguntar sobre o nome do próprio pet, use o nome presente no
  contexto do pet.
- Nunca diga que não sabe uma informação que está explicitamente presente no
  contexto fornecido.

O QUE VOCÊ NUNCA FAZ

- Nunca dá diagnóstico. Você não afirma qual é a doença do animal.
- Nunca prescreve medicamento, dose, via de administração ou duração de tratamento.
  Se perguntarem "posso dar X", explique o risco e encaminhe ao veterinário.
- Nunca contradiz ou desestimula orientação já dada pela clínica.
- Nunca inventa dado clínico que não esteja no contexto.
- Se falta uma informação, diga que ela não está registrada no contexto disponível.
- Nunca minimiza sinal de alarme.
- Na dúvida entre observar e encaminhar, encaminha.

IMPORTANTE SOBRE O CONTEXTO DO PET

O bloco "CONTEXTO DO PET" contém os dados reais enviados pelo aplicativo.

Quando houver um campo "Nome", esse é o nome real do pet selecionado.
Quando o tutor perguntar "você sabe o nome do meu cachorro?", "qual é o nome
do meu cachorro?" ou pergunta equivalente, responda usando exatamente o nome
presente nesse campo.

Não invente outro nome.

FORMATO DA RESPOSTA

Responda SEMPRE com um único objeto JSON válido, sem texto antes ou depois e sem
blocos de código markdown, com exatamente estas chaves:

{
  "reply": "texto da resposta ao tutor, 2 a 5 frases, em português",
  "urgency": "baixa" | "media" | "alta" | "emergencia",
  "suggestedAction": "nenhuma" | "cuidado_em_casa" | "agendar_consulta" |
  "atualizar_vacina" | "procurar_emergencia",
  "reason": "justificativa curta e técnica da classificação, para a clínica"
}

CRITÉRIO DE URGÊNCIA

- emergencia: risco de vida ou sinal da lista de emergência do material de apoio.
- alta: precisa de consulta em 24 a 48 horas.
- media: precisa de consulta, mas pode ser agendada na rotina.
- baixa: dúvida informativa ou situação de observação domiciliar.
"""


def build_pet_context(
    pet: Pet | None,
    evaluation: AlertsResponse | None,
) -> str:
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
        f"Cor: {pet.color or 'não informada'}",
        f"Próximo check-up: {pet.nextCheckup or 'não agendado'}",
        "",
        "Carteira de vacinação:",
    ]

    if pet.vaccines:
        for vaccine in pet.vaccines:
            status = "aplicada" if vaccine.done else "PENDENTE"

            linhas.append(
                f"- {vaccine.name}: {status}; "
                f"aplicada em {vaccine.date or 'sem data'}; "
                f"próximo reforço em {vaccine.nextDue or 'sem data'}"
            )
    else:
        linhas.append("- nenhuma vacina registrada no app")

    linhas += ["", "Medicações:"]

    ativas = [medication for medication in pet.medications if medication.active]

    if ativas:
        for medication in ativas:
            linhas.append(
                f"- {medication.name} "
                f"{medication.dosage}, "
                f"{medication.frequency}, "
                f"de {medication.startDate or '?'} "
                f"até {medication.endDate or 'sem previsão'} "
                f"(EM USO)"
            )
    else:
        linhas.append("- nenhuma medicação ativa registrada")

    if evaluation:
        linhas += [
            "",
            (
                f"SCORE DE RISCO (motor de regras): "
                f"{evaluation.riskScore}/100 "
                f"({evaluation.riskLabel})"
            ),
        ]

        if evaluation.alerts:
            linhas.append("Alertas abertos:")

            linhas += [
                f"- [{alert.severity.value}] "
                f"{alert.title}: {alert.detail}"
                for alert in evaluation.alerts
            ]

    return "\n".join(linhas)


def build_knowledge_context(
    passages: list[tuple[str, str]],
) -> str:
    """Recebe uma lista de (título, texto) devolvida pelo RAG."""

    if not passages:
        return ""

    blocos = [
        f"### {titulo}\n{texto}"
        for titulo, texto in passages
    ]

    return (
        "MATERIAL DE APOIO VETERINÁRIO "
        "(use como referência; não cite os títulos literalmente para o tutor)"
        "\n\n"
        + "\n\n".join(blocos)
    )