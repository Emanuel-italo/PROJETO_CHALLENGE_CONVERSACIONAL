"""Configuração central do serviço de IA (lida de variáveis de ambiente)."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # --- Aplicação ---
    app_name: str = "Clyvo AI Service"
    app_version: str = "1.0.0"
    cors_origins: str = "*"

    # --- LLM (qualquer provedor compatível com a API da OpenAI) ---
    # OpenAI ......: https://api.openai.com/v1
    # Groq ........: https://api.groq.com/openai/v1
    # Gemini ......: https://generativelanguage.googleapis.com/v1beta/openai
    # Ollama local : http://localhost:11434/v1
    llm_base_url: str = "https://api.openai.com/v1"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    llm_temperature: float = 0.3
    llm_max_tokens: int = 700
    llm_timeout_seconds: float = 45.0

    # --- RAG ---
    # "chroma" usa ChromaDB persistente; "simple" usa retriever TF-IDF interno
    # (sem dependência extra, útil para rodar offline na gravação do vídeo).
    rag_backend: str = "simple"
    rag_top_k: int = 3
    chroma_dir: str = "./.chroma"

    # --- RPA de notificacoes ---
    # Rotina diaria que varre a carteira de pets, aplica o motor de regras e
    # envia e-mail ao tutor quando ha vacina vencida, retorno atrasado ou
    # medicacao encerrando.
    rpa_enabled: bool = True
    rpa_hour: int = 9                 # hora local do disparo (0-23)
    rpa_minute: int = 0
    rpa_timezone: str = "America/Sao_Paulo"
    rpa_token: str = "clyvo-rpa"      # protege o disparo manual via HTTP
    rpa_db_path: str = "./clyvo_rpa.db"
    rpa_dry_run: bool = False         # True = monta o e-mail e nao envia

    # --- E-mail ---
    # provider: "smtp" | "resend" | "console"
    # "console" apenas registra no log: util para testar sem credencial.
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
        """Sem chave configurada o serviço roda em modo simulado."""
        return bool(self.llm_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
