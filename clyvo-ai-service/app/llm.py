from __future__ import annotations
import json
import re
import httpx
from .config import settings
class LLMError(RuntimeError):
    pass

def extract_json(raw: str) -> dict:
    if not raw:
        raise LLMError("O provedor retornou uma resposta vazia.")

    cleaned = re.sub(
        r"^```(?:json)?|```$",
        "",
        raw.strip(),
        flags=re.MULTILINE,
    ).strip()

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

    raise LLMError(
        f"O modelo retornou conteúdo que não é JSON válido: {cleaned[:500]}"
    )


class LLMClient:
    @property
    def enabled(self) -> bool:
        return settings.llm_enabled

    async def complete_json(
        self,
        system: str,
        messages: list[dict],
        model: str | None = None,
        timeout: float | None = None,
    ) -> dict:

        if not self.enabled:
            raise LLMError("LLM não configurado.")

        modelo = model or settings.llm_model

        payload = {
            "model": modelo,
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_tokens,
            "messages": [
                {
                    "role": "system",
                    "content": system,
                },
                *messages,
            ],
            "response_format": {
                "type": "json_object"
            },
            "include_reasoning": False,
        }

        url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"

        headers = {
            "Authorization": f"Bearer {settings.llm_api_key}",
            "Content-Type": "application/json",
        }

        print("LLM URL:", url)
        print("LLM MODEL:", modelo)
        print("LLM REQUEST ENVIADO")

        async with httpx.AsyncClient(
            timeout=timeout or settings.llm_timeout_seconds
        ) as client:

            try:
                response = await client.post(
                    url,
                    json=payload,
                    headers=headers,
                )

                print("LLM STATUS:", response.status_code)
                print("LLM RESPONSE:", response.text[:2000])

                response.raise_for_status()

            except httpx.HTTPStatusError as exc:
                raise LLMError(
                    f"Provedor retornou {exc.response.status_code}: "
                    f"{exc.response.text[:1000]}"
                ) from exc

            except httpx.HTTPError as exc:
                raise LLMError(
                    f"Falha de comunicação com o provedor: {exc}"
                ) from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise LLMError(
                f"O provedor retornou uma resposta inválida: {response.text[:500]}"
            ) from exc

        try:
            message = data["choices"][0]["message"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMError(
                f"Resposta inesperada do provedor: {data}"
            ) from exc

        content = message.get("content")

        if not content:
            raise LLMError(
                f"O provedor não retornou conteúdo em message.content: {message}"
            )

        return extract_json(content)


llm_client = LLMClient()