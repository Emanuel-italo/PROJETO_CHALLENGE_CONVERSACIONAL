"""Testes do RPA de notificações (padrão AAA)."""

import json
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.rpa import carteira, job

HOJE = date(2026, 9, 6)
TOKEN = {"X-RPA-Token": settings.rpa_token}


@pytest.fixture(autouse=True)
def banco_temporario(tmp_path, monkeypatch):
    """Isola o SQLite do RPA e força o modo simulado de e-mail."""
    monkeypatch.setattr(settings, "rpa_db_path", str(tmp_path / "rpa.db"))
    monkeypatch.setattr(settings, "email_provider", "console")
    yield


def _pet(**kwargs) -> dict:
    base = {
        "id": "pet-teste",
        "name": "Nina",
        "species": "Cachorro",
        "breed": "Golden Retriever",
        "age": "9 anos",
        "weight": "30kg",
        "ownerId": "u1",
        "vaccines": [],
        "medications": [],
        "nextCheckup": "",
        "createdAt": "",
    }
    base.update(kwargs)
    return base


def test_carteira_semente_usa_o_email_mockado():
    # Arrange / Act
    inscricoes = carteira.listar()
    # Assert
    assert inscricoes
    assert all(i.tutor_email == "emanuelitaloleal@hotmail.com" for i in inscricoes)


def test_execucao_envia_para_pet_com_vacina_vencida():
    # Arrange
    resultado = job.executar(hoje=date.today())
    # Assert
    enviados = [item for item in resultado.itens if item.status == "enviado"]
    assert enviados
    assert any("VACINA_VENCIDA" in item.alertas for item in enviados)


def test_nao_reenvia_no_mesmo_dia():
    # Arrange
    job.executar(hoje=date.today())
    # Act
    segunda = job.executar(hoje=date.today())
    # Assert
    assert segunda.enviados == 0
    assert any(item.status == "ja_enviado_hoje" for item in segunda.itens)


def test_forcar_ignora_a_trava_diaria():
    # Arrange
    job.executar(hoje=date.today())
    # Act
    forcado = job.executar(hoje=date.today(), forcar=True)
    # Assert
    assert forcado.enviados > 0


def test_pet_sem_pendencia_nao_recebe_email(monkeypatch):
    # Arrange
    futuro = (date.today() + timedelta(days=200)).isoformat()
    saudavel = _pet(
        id="pet-saudavel",
        name="Thor",
        age="2 anos",
        vaccines=[
            {
                "id": "v1",
                "name": "V10",
                "date": "2026-01-01",
                "nextDue": futuro,
                "done": True,
            }
        ],
        nextCheckup=futuro,
    )

    from app.schemas import Pet

    monkeypatch.setattr(
        carteira,
        "listar",
        lambda: [
            carteira.Inscricao(Pet(**saudavel), "Emanuel", "emanuelitaloleal@hotmail.com")
        ],
    )

    # Act
    resultado = job.executar(hoje=date.today())

    # Assert
    assert resultado.enviados == 0
    assert resultado.itens[0].status == "sem_pendencia"


def test_endpoint_run_exige_token():
    # Arrange
    client = TestClient(app)
    # Act
    sem_token = client.post("/api/rpa/run")
    # Assert
    assert sem_token.status_code == 401


def test_endpoint_run_dispara_a_rotina():
    # Arrange
    client = TestClient(app)
    # Act
    resposta = client.post("/api/rpa/run?forcar=true", headers=TOKEN)
    # Assert
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["total"] >= 1
    assert corpo["enviados"] >= 1


def test_status_expoe_agendamento_e_carteira():
    # Arrange
    client = TestClient(app)
    # Act
    corpo = client.get("/api/rpa/status").json()
    # Assert
    assert corpo["petsMonitorados"] >= 1
    assert ":" in corpo["schedule"]


def test_preview_devolve_html_sem_enviar():
    # Arrange
    client = TestClient(app)
    # Act
    resposta = client.get("/api/rpa/preview?petId=pet-nina", headers=TOKEN)
    # Assert
    assert resposta.status_code == 200
    assert "CLYVO VET" in resposta.text
    assert "Nina" in resposta.text


def test_inscricao_pelo_app_entra_na_carteira():
    # Arrange
    client = TestClient(app)
    vencida = (date.today() - timedelta(days=10)).isoformat()
    novo = _pet(
        id="pet-app",
        name="Mel",
        vaccines=[
            {
                "id": "v9",
                "name": "Antirrábica",
                "date": "2025-01-01",
                "nextDue": vencida,
                "done": True,
            }
        ],
    )

    # Act
    resposta = client.post(
        "/api/rpa/pets",
        json={
            "pet": novo,
            "tutorNome": "Emanuel",
            "tutorEmail": "emanuelitaloleal@hotmail.com",
        },
        headers=TOKEN,
    )

    # Assert
    assert resposta.status_code == 200
    assert any(i.pet.id == "pet-app" for i in carteira.listar())
