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
    # Whisper (OpenAI) ...: whisper-1
    # Whisper (Groq) .....: whisper-large-v3
    stt_model: str = "whisper-1"
    stt_timeout_seconds: float = 60.0


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


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
