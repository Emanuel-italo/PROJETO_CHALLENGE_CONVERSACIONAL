"""Testes de integração da API (rodam em modo simulado, sem chamar LLM)."""

from fastapi.testclient import TestClient

from app.main import app
from app.schemas import SuggestedAction, Urgency

client = TestClient(app)

PET = {
    "id": "p1", "name": "Nina", "species": "Cachorro", "breed": "Golden Retriever",
    "age": "9 anos", "weight": "30kg", "color": "dourado", "ownerId": "u1",
    "vaccines": [{"id": "v1", "name": "Antirrábica", "date": "2025-01-10",
                  "nextDue": "2026-01-10", "done": True}],
    "medications": [{"id": "m1", "name": "Meloxicam", "dosage": "0,1mg/kg",
                     "frequency": "1x ao dia", "startDate": "2026-08-25",
                     "endDate": "2026-09-30", "active": True}],
    "nextCheckup": "2026-12-01", "createdAt": "2025-01-01",
}


def test_health_expoe_modo_do_llm_e_do_rag():
    resposta = client.get("/health")
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["status"] == "ok"
    assert corpo["rag"]["chunks"] > 0


def test_chat_responde_com_contexto_do_pet():
    resposta = client.post("/api/chat", json={"pet": PET, "message": "quando vence a vacina da Nina?"})
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["reply"]
    assert corpo["urgency"] in [u.value for u in Urgency]
    assert corpo["sources"]
    assert any(a["code"] == "VACINA_VENCIDA" for a in corpo["alerts"])


def test_relato_de_emergencia_e_escalado_pelo_guardrail():
    resposta = client.post(
        "/api/chat",
        json={"pet": PET, "message": "a Nina teve uma convulsão agora e não levanta"},
    )
    corpo = resposta.json()
    assert corpo["urgency"] == Urgency.EMERGENCIA.value
    assert corpo["suggestedAction"] == SuggestedAction.PROCURAR_EMERGENCIA.value


def test_pedido_de_prescricao_e_recusado():
    resposta = client.post(
        "/api/chat", json={"pet": PET, "message": "posso dar dipirona pra ela?"}
    )
    corpo = resposta.json()
    assert corpo["suggestedAction"] != SuggestedAction.NENHUMA.value
    assert "veterin" in corpo["reply"].lower()


def test_chat_sem_pet_nao_quebra():
    resposta = client.post("/api/chat", json={"message": "com que idade vacino um filhote?"})
    assert resposta.status_code == 200
    assert resposta.json()["reply"]


def test_alerts_retorna_score_e_ordena_criticos_primeiro():
    resposta = client.post("/api/alerts", json=PET)
    assert resposta.status_code == 200
    corpo = resposta.json()
    assert 0 <= corpo["riskScore"] <= 100
    assert corpo["alerts"][0]["severity"] == "critico"


def test_alerts_batch_ordena_por_risco():
    saudavel = {**PET, "id": "p2", "name": "Thor", "age": "2 anos",
                "vaccines": [{"id": "v9", "name": "V10", "date": "2026-06-01",
                              "nextDue": "2027-06-01", "done": True}],
                "medications": [], "nextCheckup": "2027-01-01"}
    resposta = client.post("/api/alerts/batch", json=[saudavel, PET])
    corpo = resposta.json()
    assert corpo[0]["riskScore"] >= corpo[1]["riskScore"]