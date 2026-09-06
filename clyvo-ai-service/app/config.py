from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Clyvo AI Service"
    app_version: str = "1.0.0"
    cors_origins: str = "*"

    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_api_key: str = ""
    llm_model: str = "llama-3.1-8b-instant"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 700
    llm_timeout_seconds: float = 45.0

    rag_backend: str = "simple"
    rag_top_k: int = 3
    chroma_dir: str = "./.chroma"

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

print("LLM BASE URL:", settings.llm_base_url)
print("LLM MODEL:", settings.llm_model)
print("LLM ENABLED:", settings.llm_enabled)
