"""Testes do motor de regras (padrão AAA: Arrange, Act, Assert)."""

from datetime import date, timedelta

from app.rules import evaluate_pet
from app.schemas import AlertSeverity, Medication, Pet, Vaccine

HOJE = date(2026, 9, 6)


def _pet(**kwargs) -> Pet:
    base = dict(id="p1", name="Nina", species="Cachorro", breed="Golden Retriever",
                age="9 anos", weight="30kg", ownerId="u1")
    base.update(kwargs)
    return Pet(**base)


def test_vacina_vencida_gera_alerta_critico():
    # Arrange
    vencida = (HOJE - timedelta(days=40)).isoformat()
    pet = _pet(vaccines=[Vaccine(id="v1", name="Antirrábica", date="2025-01-10",
                                 nextDue=vencida, done=True)])
    # Act
    resultado = evaluate_pet(pet, today=HOJE)
    # Assert
    codigos = [a.code for a in resultado.alerts]
    assert "VACINA_VENCIDA" in codigos
    assert resultado.alerts[0].severity == AlertSeverity.CRITICO
    assert resultado.riskScore >= 30


def test_vacina_em_dia_nao_gera_alerta_de_vacina():
    # Arrange
    futura = (HOJE + timedelta(days=200)).isoformat()
    pet = _pet(age="3 anos",
               vaccines=[Vaccine(id="v1", name="V10", date="2026-01-10",
                                 nextDue=futura, done=True)])
    # Act
    resultado = evaluate_pet(pet, today=HOJE)
    # Assert
    assert not [a for a in resultado.alerts if a.code.startswith("VACINA")]
    assert resultado.riskLabel == "baixo"


def test_pet_idoso_e_checkup_atrasado_elevam_risco():
    # Arrange
    pet = _pet(age="9 anos", nextCheckup=(HOJE - timedelta(days=15)).isoformat(),
               vaccines=[Vaccine(id="v1", name="V10", date="2026-01-10",
                                 nextDue=(HOJE + timedelta(days=100)).isoformat(),
                                 done=True)])
    # Act
    resultado = evaluate_pet(pet, today=HOJE)
    # Assert
    codigos = [a.code for a in resultado.alerts]
    assert "CHECKUP_ATRASADO" in codigos and "PET_IDOSO" in codigos
    assert resultado.riskLabel in ("medio", "alto")


def test_medicacao_ativa_aparece_no_contexto():
    # Arrange
    pet = _pet(medications=[Medication(id="m1", name="Meloxicam", dosage="0,1mg/kg",
                                       frequency="1x ao dia", startDate="2026-08-25",
                                       endDate=(HOJE + timedelta(days=2)).isoformat(),
                                       active=True)])
    # Act
    resultado = evaluate_pet(pet, today=HOJE)
    # Assert
    codigos = [a.code for a in resultado.alerts]
    assert "MEDICACAO_ATIVA" in codigos
    assert "MEDICACAO_ENCERRANDO" in codigos


def test_pet_sem_vacina_registrada():
    # Arrange
    pet = _pet(age="2 anos", vaccines=[], medications=[])
    # Act
    resultado = evaluate_pet(pet, today=HOJE)
    # Assert
    assert resultado.alerts[0].code == "SEM_VACINA_REGISTRADA"
    assert resultado.riskScore == 25


def test_data_em_formato_brasileiro_e_aceita():
    # Arrange
    pet = _pet(vaccines=[Vaccine(id="v1", name="V10", date="10/01/2025",
                                 nextDue="10/01/2026", done=True)])
    # Act
    resultado = evaluate_pet(pet, today=HOJE)
    # Assert
    assert "VACINA_VENCIDA" in [a.code for a in resultado.alerts]