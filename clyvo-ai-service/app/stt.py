from __future__ import annotations
import httpx
from .config import settings
from .llm import LLMError


class SttClient:
    @property
    def enabled(self) -> bool:
        return settings.llm_enabled

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> str:
        if not self.enabled:
            raise LLMError("Serviço de voz não configurado.")

        url = f"{settings.llm_base_url.rstrip('/')}/audio/transcriptions"

        headers = {
            "Authorization": f"Bearer {settings.llm_api_key}",
        }

        files = {
            "file": (filename, audio_bytes, content_type or "application/octet-stream"),
        }
        data = {
            "model": settings.stt_model,
        }

        # Sem isso, o Whisper tenta adivinhar o idioma sozinho — em áudios
        # curtos ou ambíguos ele erra e assume inglês, virando texto sem
        # sentido. Forçar o idioma evita esse tipo de transcrição errada.
        if settings.stt_language:
            data["language"] = settings.stt_language

        async with httpx.AsyncClient(timeout=settings.stt_timeout_seconds) as client:
            try:
                response = await client.post(url, headers=headers, data=data, files=files)
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise LLMError(
                    f"Provedor de voz retornou {exc.response.status_code}: "
                    f"{exc.response.text[:500]}"
                ) from exc
            except httpx.HTTPError as exc:
                raise LLMError(
                    f"Falha de comunicação com o serviço de voz: {exc}"
                ) from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise LLMError(
                f"Resposta inválida do serviço de voz: {response.text[:300]}"
            ) from exc

        text = str(payload.get("text") or "").strip()

        if not text:
            raise LLMError("O serviço de voz não retornou nenhum texto transcrito.")

        return text


stt_client = SttClient()
