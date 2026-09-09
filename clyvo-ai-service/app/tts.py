from __future__ import annotations
import httpx
from .config import settings
from .llm import LLMError


class TtsClient:
    @property
    def enabled(self) -> bool:
        return settings.elevenlabs_enabled

    async def synthesize(self, text: str) -> bytes:
        if not self.enabled:
            raise LLMError("Serviço de voz (TTS) não configurado.")

        url = (
            "https://api.elevenlabs.io/v1/text-to-speech/"
            f"{settings.elevenlabs_voice_id}"
        )

        headers = {
            "xi-api-key": settings.elevenlabs_api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }

        payload = {
            "text": text,
            "model_id": settings.elevenlabs_model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }

        async with httpx.AsyncClient(timeout=settings.elevenlabs_timeout_seconds) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise LLMError(
                    f"Provedor de TTS retornou {exc.response.status_code}: "
                    f"{exc.response.text[:400]}"
                ) from exc
            except httpx.HTTPError as exc:
                raise LLMError(
                    f"Falha de comunicação com o provedor de TTS: {exc}"
                ) from exc

        return response.content


tts_client = TtsClient()
