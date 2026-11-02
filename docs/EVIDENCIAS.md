# Evidências de funcionamento – CLYVO VET (4º Sprint)

Registro dos testes automatizados e de chamadas reais à API publicada em
https://projeto-challenge-conversacional.onrender.com, coletados em 02/11/2026.

---

## 1. Testes automatizados

Comando (de dentro de `clyvo-ai-service`):

```bash
python -m pytest app/tests -v
```

Resultado: **23 passed**.

```
app/tests/test_api.py::test_health_expoe_modo_do_llm_e_do_rag PASSED
app/tests/test_api.py::test_chat_responde_com_contexto_do_pet PASSED
app/tests/test_api.py::test_relato_de_emergencia_e_escalado_pelo_guardrail PASSED
app/tests/test_api.py::test_pedido_de_prescricao_e_recusado PASSED
app/tests/test_api.py::test_chat_sem_pet_nao_quebra PASSED
app/tests/test_api.py::test_alerts_retorna_score_e_ordena_criticos_primeiro PASSED
app/tests/test_api.py::test_alerts_batch_ordena_por_risco PASSED
app/tests/test_rpa.py::test_carteira_semente_usa_o_email_mockado PASSED
app/tests/test_rpa.py::test_execucao_envia_para_pet_com_vacina_vencida PASSED
app/tests/test_rpa.py::test_nao_reenvia_no_mesmo_dia PASSED
app/tests/test_rpa.py::test_forcar_ignora_a_trava_diaria PASSED
app/tests/test_rpa.py::test_pet_sem_pendencia_nao_recebe_email PASSED
app/tests/test_rpa.py::test_endpoint_run_exige_token PASSED
app/tests/test_rpa.py::test_endpoint_run_dispara_a_rotina PASSED
app/tests/test_rpa.py::test_status_expoe_agendamento_e_carteira PASSED
app/tests/test_rpa.py::test_preview_devolve_html_sem_enviar PASSED
app/tests/test_rpa.py::test_inscricao_pelo_app_entra_na_carteira PASSED
app/tests/test_rules.py::test_vacina_vencida_gera_alerta_critico PASSED
app/tests/test_rules.py::test_vacina_em_dia_nao_gera_alerta_de_vacina PASSED
app/tests/test_rules.py::test_pet_idoso_e_checkup_atrasado_elevam_risco PASSED
app/tests/test_rules.py::test_medicacao_ativa_aparece_no_contexto PASSED
app/tests/test_rules.py::test_pet_sem_vacina_registrada PASSED
app/tests/test_rules.py::test_data_em_formato_brasileiro_e_aceita PASSED
============================= 23 passed =============================
```

> Os testes rodam sem chave de LLM (modo simulado), para serem reproduzíveis
> por qualquer pessoa sem custo de API.

---

## 2. Status da API publicada – `GET /health`

```json
{
  "status": "ok",
  "version": "1.0.0",
  "llm":    { "enabled": true, "model": "openai/gpt-oss-20b", "mode": "live" },
  "vision": { "enabled": true, "model": "qwen/qwen3.8-27b" },
  "rag":    { "backend": "simple", "chunks": 5 },
  "stt":    { "enabled": true, "model": "whisper-large-v3-turbo" },
  "tts":    { "enabled": true, "voiceId": "RGymW84CSmfVugnA5tvA" },
  "rpa":    { "enabled": true, "schedule": "09:00", "timezone": "America/Sao_Paulo", "emailProvider": "resend" }
}
```

---

## 3. Cenários reais de conversa – `POST /api/chat`

Pet usado nos cenários: **Nina**, Golden Retriever, 9 anos, 30 kg, antirrábica
com reforço previsto para 10/01/2026 (vencida).

### Cenário A – Personalização com o histórico do pet

**Tutor:** "quando vence a vacina da Nina?"

```json
{
  "reply": "A vacina antirrábica da Nina venceu em 10 de janeiro de 2026. É importante agendar uma consulta para atualizar a vacinação.",
  "urgency": "alta",
  "suggestedAction": "atualizar_vacina",
  "reason": "vacina antirrábica vencida, requer reforço",
  "simulated": false
}
```

A LLM usou os dados do pet (nome, vacina, data) e o motor de regras para indicar a ação.

### Cenário B – Sintoma com janela de observação

**Tutor:** "a Nina vomitou duas vezes hoje e está sem apetite"

```json
{
  "reply": "Esse sinal em Nina merece avaliação. Se persistir por mais de 24 horas ou vier acompanhado de prostração, recusa de água ou piora, agende consulta. Registre no app o que você observou e desde quando, para a clínica acompanhar a evolução. ...",
  "urgency": "alta",
  "suggestedAction": "agendar_consulta",
  "reason": "Sinal clínico com janela de 24 a 48 horas.",
  "simulated": true
}
```

Nesta chamada a requisição à LLM falhou e o **modo simulado** (regras + RAG)
assumiu automaticamente — o tutor continua recebendo orientação.

### Cenário C – Emergência (guardrail)

**Tutor:** "a Nina teve uma convulsão agora e não levanta"

```json
{
  "reply": "Nina está apresentando convulsão e não se levanta, o que indica uma emergência. É importante levá-la imediatamente ao pronto-socorro veterinário ou ligar para a clínica de emergência.",
  "urgency": "emergencia",
  "suggestedAction": "procurar_emergencia",
  "reason": "convulsão e incapacidade de levantar, sinal de emergência",
  "simulated": false
}
```

---

## 4. Avaliação do RAG – qual embedding usar no banco vetorial

Mesmas perguntas, comparando qual documento da base cada abordagem recupera em 1º lugar:

| Pergunta do tutor | Esperado | TF-IDF (palavras) | ChromaDB + `all-MiniLM-L6-v2` (inglês) | ChromaDB + `gemini-embedding-001` (multilíngue) |
|---|---|---|---|---|
| quando vence a vacina? | vacinação | ✅ vacinação | ✅ vacinação | ✅ vacinação (0,67) |
| minha cachorra vomitou e está enjoada | emergências | ✅ emergências | ✅ emergências | ✅ emergências (0,73) |
| teve convulsão | emergências | ✅ emergências | ❌ vacinação | ✅ emergências (0,64) |
| posso dar dipirona | medicação | ✅ medicação | ❌ vacinação | ✅ medicação (0,69) |
| ela está muito gorda | preventivo | ✅ medicação/preventivo | ❌ vacinação | ✅ preventivo (0,62) |

**Conclusão:** o modelo padrão do ChromaDB é treinado em inglês e erra em português.
Com embeddings multilíngues do Gemini, o banco vetorial acerta todos os casos e com
similaridade bem maior (0,6–0,7 contra 0,07–0,13 do TF-IDF), por isso foi a configuração
adotada. O TF-IDF ficou como fallback automático.

Consumo de memória do serviço com ChromaDB + Gemini: **~150 MB** (pico medido localmente).

---

## 5. Como reproduzir

```bash
curl https://projeto-challenge-conversacional.onrender.com/health

curl -X POST https://projeto-challenge-conversacional.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"pet":{"id":"p1","name":"Nina","species":"Cachorro","breed":"Golden Retriever","age":"9 anos","weight":"30kg","ownerId":"u1","vaccines":[{"id":"v1","name":"Antirrábica","date":"2025-01-10","nextDue":"2026-01-10","done":true}],"medications":[]},"message":"quando vence a vacina da Nina?","history":[]}'
```

---

## 6. Telas do app

_Adicionar aqui prints do app: login, lista de pets, detalhe do pet com alertas,
chat com resposta da IA (texto, voz e foto) e e-mail recebido do RPA._
