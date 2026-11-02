# CLYVO VET 🐾

Aplicativo mobile para tutores acompanharem a saúde de seus pets, com assistente de IA conversacional (texto, voz e foto), alertas inteligentes da jornada de saúde e lembretes automáticos por e-mail.

> **Challenge FIAP – Disruptive Architectures: IoT, IoB & Generative IA – 4º Sprint**

| | |
|---|---|
| 🎥 **Vídeo pitch** | _[cole aqui o link do YouTube (não listado)]_ |
| 🌐 **API publicada** | https://projeto-challenge-conversacional.onrender.com |
| 📚 **Swagger** | https://projeto-challenge-conversacional.onrender.com/docs |
| 🧪 **Evidências** | [docs/EVIDENCIAS.md](docs/EVIDENCIAS.md) |

---

## 📸 Visão Geral

- ✅ **Cadastro de pets** com perfil, vacinas, medicamentos e próximo check-up
- ✅ **Assistente conversacional com IA generativa** (LLM + RAG) que conhece o histórico do pet
- ✅ **Entrada por voz** (Whisper) e **resposta falada** (ElevenLabs)
- ✅ **Análise de foto** do pet/sintoma com modelo de visão
- ✅ **Motor de regras** determinístico que calcula score de risco e gera alertas
- ✅ **Guardrail de emergência**: relatos graves sempre escalam para "procurar emergência"
- ✅ **RPA diário** que envia e-mail ao tutor quando há pendências (vacina vencida, check-up atrasado etc.)
- ✅ **Autenticação Firebase** (e-mail/senha e Google)
- ✅ **API pública** hospedada no Render

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────┐
│  App: React Native + Expo (TypeScript)   │
│  Firebase Auth · AsyncStorage (pets)     │
└───────────────────┬──────────────────────┘
                    │ HTTPS / REST (JSON, multipart)
                    ↓
┌──────────────────────────────────────────┐
│  clyvo-ai-service: FastAPI (Python)      │
│  publicado no Render                     │
│                                          │
│  /api/chat ─┬─ Motor de regras (risco)   │
│             ├─ RAG (base de conhecimento)│
│             ├─ LLM (Groq, API OpenAI)    │
│             └─ Guardrail de emergência   │
│  /api/alerts ── Motor de regras          │
│  /api/speech ── STT (Whisper) / TTS      │
│  /api/rpa ───── Agendador + SQLite +     │
│                 e-mail (Resend/SMTP)     │
└──────────────────────────────────────────┘
```

### Fluxo de uma mensagem no chat

1. O app envia a **mensagem do tutor + dados do pet + histórico** (últimas 8 mensagens) para `POST /api/chat`.
2. O **motor de regras** (`rules.py`) avalia o pet: vacinas vencidas/próximas, medicação ativa, check-up atrasado, idade → gera alertas e um **score de risco (0–100)**.
3. O **RAG** (`rag.py`) busca os trechos mais relevantes da base de conhecimento veterinária (`app/knowledge/*.md`: vacinação, medicação, preventivo, emergências).
4. O **prompt** (`prompts.py`) junta contexto do pet + alertas + trechos recuperados + pergunta, e a **LLM** responde em JSON estruturado: `reply`, `urgency`, `suggestedAction`, `reason`.
5. O **guardrail** verifica termos de emergência (convulsão, dificuldade respiratória etc.) e, se necessário, **eleva a urgência** independentemente da resposta da LLM.
6. Se a LLM falhar (timeout, limite de uso), o serviço cai para um **modo simulado** baseado em regras + RAG, e a resposta vem com `simulated: true` — o tutor nunca fica sem resposta.
7. Se houver foto (`imageBase64`), a requisição vai para o **modelo de visão**.

### Técnicas de IA aplicadas

| Técnica | Onde | Detalhe |
|---|---|---|
| IA Generativa / LLM | `llm.py`, `routers/chat.py` | Modelo `openai/gpt-oss-20b` via Groq, saída em JSON mode |
| Prompt engineering | `prompts.py` | System prompt com papel, limites (não prescreve) e formato de saída |
| RAG com banco vetorial | `rag.py` | Base de conhecimento convertida em **embeddings semânticos** (`gemini-embedding-001`, 768 dimensões, multilíngue) e armazenada no **ChromaDB** (índice HNSW, distância de cosseno). A pergunta do tutor vira embedding e o ChromaDB devolve os trechos mais próximos |
| Fallback de busca | `rag.py` | Se o Gemini ou o ChromaDB falharem, a busca cai para **TF-IDF + cosseno** em memória, com expansão de termos populares ("xixi" → urinário) |
| Visão computacional | `routers/chat.py` | Modelo multimodal analisa foto enviada pelo tutor |
| Speech-to-Text | `stt.py` | Whisper (`whisper-large-v3-turbo`), idioma forçado em `pt` |
| Text-to-Speech | `tts.py` | ElevenLabs, voz multilíngue |
| Sistema especialista (regras) | `rules.py` | Score de risco e alertas determinísticos |
| Guardrail | `routers/chat.py`, `simulator.py` | Escalonamento obrigatório de emergências |
| RPA | `scheduler.py`, `job.py`, `carteira.py` | Rotina diária 09:00 (America/Sao_Paulo) que avalia pets e envia e-mail |

### Persistência de dados

| Dado | Onde fica |
|---|---|
| Conta do usuário | Firebase Authentication |
| Pets, vacinas, medicamentos | AsyncStorage (no dispositivo) |
| Histórico do chat | AsyncStorage (no dispositivo) |
| Pets inscritos nos lembretes + registro de envios do RPA | SQLite no backend (`clyvo_rpa.db`) |
| Base de conhecimento do RAG | Arquivos Markdown em `app/knowledge/` → embeddings no **ChromaDB** (banco vetorial, pasta `.chroma/`) |

---

## 🧰 Tecnologias

**Frontend:** React Native 0.81 · Expo 54 · TypeScript · React Navigation · TanStack Query · Firebase Auth · AsyncStorage · expo-audio / expo-speech / expo-image-picker

**Backend:** Python · FastAPI · Pydantic / pydantic-settings · httpx · Uvicorn · SQLite

**IA:** Groq (API compatível com OpenAI) · Whisper · ElevenLabs · ChromaDB (banco vetorial) · Gemini Embeddings

**Infra:** Render (API) · Firebase (Auth) · GitHub Actions (`cron-github-actions.yml`)

---

## 🚀 Como rodar

### Pré-requisitos

- Node.js 18+ e npm
- Python 3.11+
- Chave de API de um provedor compatível com OpenAI (usamos a **Groq**: https://console.groq.com)
- (Opcional) chave ElevenLabs para voz e chave Resend/SMTP para e-mails

### 1. Frontend

```bash
git clone https://github.com/Emanuel-italo/PROJETO_CHALLENGE_CONVERSACIONAL.git
cd PROJETO_CHALLENGE_CONVERSACIONAL
npm install

npm start         # abre o Expo (QR code para o Expo Go)
npm run android   # Android
npm run ios       # iOS
npm run web       # navegador
```

> Não existe `npm run dev` — o projeto usa os scripts do Expo acima.

O app já aponta para a API publicada (`src/services/AiService.ts` → `BASE_URL`).

### 2. Backend (opcional — a API já está publicada)

```bash
cd clyvo-ai-service
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r Requirements.txt
```

Crie `clyvo-ai-service/.env`:

```env
# LLM (qualquer provedor compatível com OpenAI)
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_API_KEY=gsk_sua_chave
LLM_MODEL=openai/gpt-oss-20b
VISION_MODEL=qwen/qwen3.8-27b

# Voz → texto (usa a mesma chave/URL da LLM)
STT_MODEL=whisper-large-v3-turbo
STT_LANGUAGE=pt

# Texto → voz
ELEVENLABS_API_KEY=sua_chave
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# RAG: chroma (banco vetorial) ou simple (TF-IDF em memória)
RAG_BACKEND=chroma
# Embeddings multilíngues — chave gratuita em https://aistudio.google.com/apikey
GEMINI_API_KEY=sua_chave

# RPA / e-mail: console (só loga), smtp ou resend
EMAIL_PROVIDER=console
RESEND_API_KEY=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
RPA_TOKEN=clyvo-rpa

CORS_ORIGINS=*
```

Sem `LLM_API_KEY` o serviço sobe em **modo simulado** (regras + RAG), útil para testes.

Rodar (de dentro de `clyvo-ai-service`):

```bash
uvicorn app.main:app --reload --port 8000
```

Swagger: http://localhost:8000/docs

---

## 🔌 Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Status e configuração ativa (LLM, RAG, voz, RPA) |
| POST | `/api/chat` | Assistente conversacional (texto e/ou foto) |
| POST | `/api/alerts` | Score de risco e alertas de um pet |
| POST | `/api/alerts/batch` | Avaliação de vários pets, ordenada por risco |
| POST | `/api/speech/transcribe` | Áudio → texto (multipart, campo `file`) |
| GET | `/api/speech/synthesize?text=...` | Texto → áudio MP3 |
| GET | `/api/rpa/status` | Agendamento e pets monitorados |
| POST | `/api/rpa/run` | Dispara a rotina de e-mails (header `X-RPA-Token`) |
| GET | `/api/rpa/preview?petId=...` | Pré-visualiza o e-mail em HTML |
| POST | `/api/rpa/pets` | Inscreve um pet nos lembretes |

### Exemplo — `POST /api/chat`

```json
{
  "pet": {
    "id": "p1", "name": "Nina", "species": "Cachorro", "breed": "Golden Retriever",
    "age": "9 anos", "weight": "30kg", "ownerId": "u1",
    "vaccines": [{ "id": "v1", "name": "Antirrábica", "date": "2025-01-10", "nextDue": "2026-01-10", "done": true }],
    "medications": []
  },
  "message": "quando vence a vacina da Nina?",
  "history": []
}
```

Resposta real da API publicada:

```json
{
  "reply": "A vacina antirrábica da Nina venceu em 10 de janeiro de 2026. É importante agendar uma consulta para atualizar a vacinação.",
  "urgency": "alta",
  "suggestedAction": "atualizar_vacina",
  "reason": "vacina antirrábica vencida, requer reforço",
  "sources": ["..."],
  "alerts": [{ "code": "VACINA_VENCIDA", "severity": "critico", "...": "..." }],
  "simulated": false
}
```

**Urgências:** `baixa`, `media`, `alta`, `emergencia`
**Ações:** `nenhuma`, `cuidado_em_casa`, `agendar_consulta`, `atualizar_vacina`, `procurar_emergencia`

---

## 🧪 Testes

```bash
cd clyvo-ai-service
python -m pytest app/tests -v
```

| Arquivo | O que valida |
|---|---|
| `test_rules.py` | Motor de regras: vacina vencida/em dia, pet idoso, check-up atrasado, medicação, datas em formato BR |
| `test_api.py` | Endpoints: health, chat com contexto do pet, guardrail de emergência, recusa de prescrição, alertas e lote |
| `test_rpa.py` | RPA: carteira, envio, trava diária, endpoint protegido por token, preview e inscrição |

**Resultado atual: 23 testes passando.** Detalhes e respostas reais da API em [docs/EVIDENCIAS.md](docs/EVIDENCIAS.md).

---

## 📊 Estrutura

```
PROJETO_CHALLENGE_CONVERSACIONAL/
├── App.tsx / index.ts          # entrada do app
├── src/
│   ├── screens/                # auth, dashboard, pet (inclui PetChatScreen), health, profile
│   ├── components/             # cards, header, menu, inputs
│   ├── hooks/                  # useAiChat, useVoiceRecorder, usePetRisk, usePets...
│   ├── services/               # AiService (API), AuthService/firebase, PetService, StorageService
│   ├── contexts/ navigation/ interfaces/ ...
├── clyvo-ai-service/
│   ├── app/
│   │   ├── main.py             # FastAPI + /health
│   │   ├── config.py           # variáveis de ambiente
│   │   ├── llm.py              # cliente LLM (API compatível com OpenAI)
│   │   ├── prompts.py          # system prompt e montagem de contexto
│   │   ├── rag.py              # RAG (TF-IDF / ChromaDB)
│   │   ├── rules.py            # motor de regras e score de risco
│   │   ├── simulator.py        # modo simulado / termos de emergência
│   │   ├── stt.py / tts.py     # voz
│   │   ├── scheduler.py / job.py / carteira.py / mailer.py / templates.py  # RPA
│   │   ├── routers/            # chat, alerts, speech, rpa
│   │   ├── knowledge/          # base de conhecimento do RAG
│   │   └── tests/              # testes automatizados
│   └── Requirements.txt
└── docs/EVIDENCIAS.md          # resultados dos testes e da API
```

---

## 📈 Resultados

- Integração completa **app → API → regras + RAG + LLM → app**, funcionando na API publicada.
- A IA **personaliza** a resposta com os dados do pet (nome, idade, vacinas, medicação) e indica **urgência e próxima ação**, apoiando o acompanhamento contínuo da saúde.
- **Segurança**: o guardrail força "procurar emergência" em relatos graves, e o assistente não prescreve medicamentos.
- **Resiliência**: em falha da LLM, o modo simulado mantém o atendimento.
- **Para a clínica**: o RPA lembra o tutor de vacinas e check-ups, trazendo-o de volta à clínica.

### Limitações e próximos passos

- Dados dos pets ficam no dispositivo (AsyncStorage); próximo passo é sincronizar em banco na nuvem (ex.: Firestore).
- Ampliar a base de conhecimento veterinária e dividi-la em mais seções para buscas mais precisas.

---

## 🛠️ Troubleshooting

- **`npm run dev` não funciona** → use `npm start` (Expo).
- **Primeira resposta demora ~30s** → cold start do Render; chame `/health` antes para "acordar" a API.
- **Resposta com `simulated: true`** → a LLM falhou ou atingiu limite de uso; o campo `llmError` traz o motivo.
- **Erro de import ao rodar o backend** → rode `uvicorn app.main:app` de dentro de `clyvo-ai-service` (não de dentro de `app/`).
