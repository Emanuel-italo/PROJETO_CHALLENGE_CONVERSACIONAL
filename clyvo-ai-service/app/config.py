from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
    app_name: str = "Clyvo AI Service"
    app_version: str = "1.0.0"
    cors_origins: str = "*"
    # OpenAI ......: https://api.openai.com/v1
    # Groq ........: https://api.groq.com/openai/v1
    # Gemini ......: https://generativelanguage.googleapis.com/v1beta/openai
    # Ollama local : http://localhost:11434/v1
    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 700
    llm_timeout_seconds: float = 25.0
    # Visão computacional (foto do pet). Modelos com suporte a imagem na
    # Groq mudam com frequência — confira console.groq.com/docs/vision.
    vision_model: str = "qwen/qwen3.6-27b"
    # Whisper (OpenAI) ...: whisper-1
    # Whisper (Groq) .....: whisper-large-v3
    stt_model: str = "whisper-1"
    stt_timeout_seconds: float = 60.0
    # Código ISO-639-1 do idioma falado pelo tutor. Vazio = deixa o
    # Whisper adivinhar sozinho (não recomendado, ver comentário em stt.py).
    stt_language: str = "pt"

    # TTS (ElevenLabs) — voz personalizada das respostas.
    # Voice IDs: https://elevenlabs.io/app/voice-library
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    elevenlabs_model_id: str = "eleven_multilingual_v2"
    elevenlabs_timeout_seconds: float = 30.0


    rag_backend: str = "simple"
    rag_top_k: int = 3
    chroma_dir: str = "./.chroma"
    rpa_enabled: bool = True
    rpa_hour: int = 9            
    rpa_minute: int = 0
    rpa_timezone: str = "America/Sao_Paulo"
    rpa_token: str = "clyvo-rpa"      
    rpa_db_path: str = "./clyvo_rpa.db"
    rpa_dry_run: bool = False         
    email_provider: str = "console"
    email_from: str = "Clyvo Vet <nao-responda@clyvo.com.br>"
    email_reply_to: str = ""

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True

    resend_api_key: str = ""

    @property
    def knowledge_dir(self) -> Path:
        return Path(__file__).parent / "knowledge"

    @property
    def llm_enabled(self) -> bool:
        return bool(self.llm_api_key.strip())

    @property
    def elevenlabs_enabled(self) -> bool:
        return bool(self.elevenlabs_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
