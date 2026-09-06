"""Cliente de LLM compatível com a API da OpenAI.

Funciona com qualquer provedor que exponha `/chat/completions`: OpenAI, Azure
OpenAI (via gateway compatível), Groq, Gemini (endpoint OpenAI-compatible),
Together ou Ollama local. Basta trocar LLM_BASE_URL, LLM_API_KEY e LLM_MODEL.

Sem chave configurada o serviço entra em MODO SIMULADO (ver `simulator.py`):
responde a partir do motor de regras e do RAG, sem chamada externa. Isso mantém
a aplicação demonstrável na gravação do vídeo e nos testes, sem custo e sem rede.
"""

from __future__ import annotations

import json
import re

import httpx

from .config import settings


class LLMError(RuntimeError):
    pass


def extract_json(raw: str) -> dict:
    """Extrai o objeto JSON da resposta, tolerando cercas markdown e preâmbulo."""
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    # Último recurso: entrega o texto bruto como resposta, com urgência
    # conservadora para nunca subestimar um relato.
    return {
        "reply": cleaned,
        "urgency": "media",
        "suggestedAction": "agendar_consulta",
        "reason": "resposta do modelo fora do formato JSON esperado",
    }


class LLMClient:
    """Isola o provedor atrás de uma interface única."""

    @property
    def enabled(self) -> bool:
        return settings.llm_enabled

    async def complete_json(self, system: str, messages: list[dict]) -> dict:
        if not self.enabled:
            raise LLMError("LLM não configurado (LLM_API_KEY vazio)")

        payload = {
            "model": settings.llm_model,
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_tokens,
            "messages": [{"role": "system", "content": system}, *messages],
        }
        url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.llm_api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise LLMError(
                    f"Provedor retornou {exc.response.status_code}: "
                    f"{exc.response.text[:200]}"
                ) from exc
            except httpx.HTTPError as exc:
                raise LLMError(f"Falha de comunicacao com o provedor: {exc}") from exc

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise LLMError(f"Resposta inesperada do provedor: {data}") from exc

        return extract_json(content)


llm_client = LLMClient()