"""Carteira de pets acompanhada pelo RPA.

Enquanto a base de produção não está integrada, a carteira vem de um arquivo
JSON versionado (`carteira.json`) e pode ser atualizada em tempo de execução
pelo aplicativo, via `POST /api/rpa/pets`, o que grava em SQLite.

A leitura junta as duas origens: o que veio do app tem precedência sobre o
arquivo, casando pelo id do pet. Trocar isso pelo Oracle da aplicação depois
significa reescrever apenas `listar()`.
"""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from .config import settings
from .schemas import Pet


class Inscricao:
    """Um pet acompanhado, com o e-mail do tutor."""

    def __init__(self, pet: Pet, tutor_nome: str, tutor_email: str) -> None:
        self.pet = pet
        self.tutor_nome = tutor_nome
        self.tutor_email = tutor_email


def _arquivo_seed() -> Path:
    return Path(__file__).parent / "carteira.json"


def _conectar() -> sqlite3.Connection:
    Path(settings.rpa_db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(settings.rpa_db_path)
    conn.row_factory = sqlite3.Row
    return conn


def criar_schema() -> None:
    with _conectar() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS inscricao (
                pet_id       TEXT PRIMARY KEY,
                tutor_nome   TEXT NOT NULL,
                tutor_email  TEXT NOT NULL,
                pet_json     TEXT NOT NULL,
                atualizado_em TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS envio (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id      TEXT NOT NULL,
                destino     TEXT NOT NULL,
                data        TEXT NOT NULL,
                assunto     TEXT NOT NULL,
                alertas     TEXT NOT NULL,
                status      TEXT NOT NULL,
                detalhe     TEXT
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_envio_pet_data ON envio (pet_id, data)"
        )


def salvar(inscricao: Inscricao, quando: str) -> None:
    criar_schema()

    with _conectar() as conn:
        conn.execute(
            "INSERT INTO inscricao (pet_id, tutor_nome, tutor_email, pet_json, atualizado_em) "
            "VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(pet_id) DO UPDATE SET "
            "tutor_nome=excluded.tutor_nome, tutor_email=excluded.tutor_email, "
            "pet_json=excluded.pet_json, atualizado_em=excluded.atualizado_em",
            (
                inscricao.pet.id,
                inscricao.tutor_nome,
                inscricao.tutor_email,
                inscricao.pet.model_dump_json(),
                quando,
            ),
        )


def _do_arquivo() -> list[Inscricao]:
    caminho = _arquivo_seed()

    if not caminho.exists():
        return []

    dados = json.loads(caminho.read_text(encoding="utf-8"))

    return [
        Inscricao(
            pet=Pet(**item["pet"]),
            tutor_nome=item.get("tutorNome", ""),
            tutor_email=item["tutorEmail"],
        )
        for item in dados
    ]


def _do_banco() -> list[Inscricao]:
    criar_schema()

    with _conectar() as conn:
        linhas = conn.execute(
            "SELECT tutor_nome, tutor_email, pet_json FROM inscricao"
        ).fetchall()

    return [
        Inscricao(
            pet=Pet(**json.loads(linha["pet_json"])),
            tutor_nome=linha["tutor_nome"],
            tutor_email=linha["tutor_email"],
        )
        for linha in linhas
    ]


def listar() -> list[Inscricao]:
    """Carteira completa: arquivo semente sobrescrito pelo que veio do app."""
    por_id: dict[str, Inscricao] = {i.pet.id: i for i in _do_arquivo()}

    for inscricao in _do_banco():
        por_id[inscricao.pet.id] = inscricao

    return list(por_id.values())


# --------------------------------------------------------------------------- #
# Registro de envios (evita duplicar no mesmo dia)
# --------------------------------------------------------------------------- #
def ja_enviado_hoje(pet_id: str, hoje: str) -> bool:
    criar_schema()

    with _conectar() as conn:
        linha = conn.execute(
            "SELECT 1 FROM envio WHERE pet_id = ? AND data = ? AND status = 'enviado'",
            (pet_id, hoje),
        ).fetchone()

    return linha is not None


def registrar_envio(
    pet_id: str, destino: str, data: str, assunto: str,
    alertas: list[str], status: str, detalhe: str = "",
) -> None:
    criar_schema()

    with _conectar() as conn:
        conn.execute(
            "INSERT INTO envio (pet_id, destino, data, assunto, alertas, status, detalhe) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (pet_id, destino, data, assunto, ",".join(alertas), status, detalhe[:400]),
        )


def historico(limite: int = 20) -> list[dict]:
    criar_schema()

    with _conectar() as conn:
        linhas = conn.execute(
            "SELECT pet_id, destino, data, assunto, alertas, status, detalhe "
            "FROM envio ORDER BY id DESC LIMIT ?",
            (limite,),
        ).fetchall()

    return [dict(linha) for linha in linhas]
