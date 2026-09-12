# CLYVO VET 🐾

Aplicativo mobile para tutores acompanharem a saúde de seus pets com assistente de IA conversacional, alertas inteligentes e jornada de saúde personalizada.

## 📸 Visão Geral

**CLYVO VET** combina um aplicativo React Native/Expo com uma camada de IA poderosa em Python/FastAPI, oferecendo:

- ✅ **Cadastro completo** de pets (perfil, vacinas, medicamentos)
- ✅ **Chat conversacional** 
- ✅ **Alertas inteligentes** baseados em regras determinísticas
- ✅ **Análise de imagens** de pets/sintomas via Claude Vision
- ✅ **Histórico médico** persistido localmente e na nuvem
- ✅ **Autenticação Firebase** com suporte a Google Login
- ✅ **API pública** publicada no Render.com

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│   Frontend: React Native + Expo      │
│   (TypeScript, AsyncStorage, Auth)   │
└──────────────┬──────────────────────┘
               │ REST API
               ↓
┌─────────────────────────────────────┐
│   Backend: FastAPI (Python)          │
│   🌐 Publicado: https://             │
│   projeto-challenge-conversacional   │
│   .onrender.com                      │
└──────────────┬──────────────────────┘
               │
        ┌──────┼──────┐
        ↓      ↓      ↓
    ┌────┐ ┌────┐ ┌──────┐
    │RAG │ │Rules│ │LLM   │
    │Eng │ │Motor│ │Claude│
    └────┘ └────┘ └──────┘
        │
┌───────┴─────────────────────────────┐
│   Firebase (Auth + Validação)       │
│   AsyncStorage (Dados locais)       │
│   Render Database (Persistência)    │
└─────────────────────────────────────┘
```

### Stack Tecnológico

**Frontend:**
- React Native 0.81 + Expo (cross-platform: iOS, Android, Web)
- TypeScript com `strict: true`
- React Navigation (native-stack + bottom-tabs)
- Firebase Authentication
- AsyncStorage (persistência local)
- TanStack Query (pronto para integração com API real)

**Backend:**
- Python 3.11+
- FastAPI (async, high-performance)
- Claude LLM (Anthropic API)
- ChromaDB (RAG - Retrieval-Augmented Generation)
- FastAPI STT/TTS (OpenAI Whisper, ElevenLabs)
- Pydantic (validação de schemas)
- APScheduler (RPA automático)

**Infra & Deploy:**
- **Render.com** - Hosting da API Python
- Firebase Firestore/Auth - Backend complementar
- Docker - Containerização

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18+ com npm
- **Python** 3.11+
- **Git**
- Conta Firebase (optional, para auth)
- API key Anthropic (Claude)

### 1️⃣ Clonar e Instalar Frontend

```bash
git clone https://github.com/Emanuel-italo/PROJETO_CHALLENGE_CONVERSACIONAL.git
cd PROJETO_CHALLENGE_CONVERSACIONAL

# Instalar dependências
npm install

# Verificar tipos TypeScript
npx tsc --noEmit
```

### 2️⃣ Rodar Frontend Localmente

```bash
# Iniciar Expo
npm start

# Abrir em Android
npm run android

# Abrir em iOS
npm run ios

# Abrir em Web
npm run web
```

O app estará em `http://localhost:19000` (Expo DevTools).

### 3️⃣ Backend - Instalar Dependências Python

```bash
cd clyvo-ai-service

# Criar ambiente virtual (recomendado)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r Requirements.txt
```

### 4️⃣ Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do `clyvo-ai-service`:

```env
# Anthropic
ANTHROPIC_API_KEY=sk-your-api-key-here

# OpenAI (STT)
OPENAI_API_KEY=sk-your-key-here

# ElevenLabs (TTS)
ELEVENLABS_API_KEY=your-key-here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # Rachel (exemplo)

# Firebase
FIREBASE_API_KEY=your-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id

# Email (RPA)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=seu-app-password

# App
APP_NAME=CLYVO VET
APP_VERSION=1.0.0
CORS_ORIGINS=http://localhost:3000,http://localhost:19000,https://seu-dominio.com
```

### 5️⃣ Rodar Backend Localmente

```bash
cd clyvo-ai-service/app

# Usando Uvicorn
uvicorn main:app --reload --port 8000

# Ou usando Python direto
python -m uvicorn main:app --reload
```

Backend estará em `http://localhost:8000`

**Endpoints disponíveis:**
- `GET /health` - Status do serviço
- `POST /api/chat` - Chat com IA
- `POST /api/alerts` - Avaliação de riscos
- `POST /api/alerts/batch` - Avaliação em lote
- `POST /api/speech/transcribe` - STT (voz → texto)
- `GET /api/speech/synthesize` - TTS (texto → voz)

Docs interativa: `http://localhost:8000/docs`

---

## 📊 Estrutura de Arquivos

```
PROJETO_CHALLENGE_CONVERSACIONAL/
├── src/
│   ├── components/          # UI reutilizáveis
│   ├── screens/             # Telas por domínio (auth/, pet/, health/, etc)
│   ├── hooks/               # Lógica de dados (usePets, useVaccines, etc)
│   ├── services/            # Integração Firebase, AsyncStorage, IA
│   ├── interfaces/          # Contratos (IPetService)
│   ├── types/               # TypeScript types
│   ├── contexts/            # AuthContext
│   ├── navigation/          # React Navigation
│   ├── utils/               # Validadores, formatadores, alertas
│   └── styles/              # StyleSheets por tela
├── clyvo-ai-service/
│   ├── app/
│   │   ├── main.py          # FastAPI app + endpoints
│   │   ├── config.py        # Configurações (env vars)
│   │   ├── llm.py           # Cliente Claude
│   │   ├── rag.py           # RAG Engine + embeddings
│   │   ├── rules.py         # Rules Motor (alertas)
│   │   ├── routers/         # Rotas FastAPI (chat, alerts, speech)
│   │   ├── prompts.py       # Prompts para Claude
│   │   ├── stt.py           # Speech-to-text
│   │   ├── tts.py           # Text-to-speech
│   │   ├── scheduler.py     # APScheduler para RPA
│   │   ├── job.py           # Jobs automáticos (email alerts)
│   │   ├── templates.py     # Templates de email
│   │   ├── knowledge/       # Base de conhecimento (docs)
│   │   └── tests/           # Testes unitários
│   ├── Dockerfile           # Docker image
│   └── Requirements.txt      # Dependências Python
├── App.tsx                  # Root component
├── index.ts                 # Entry point
├── package.json             # Frontend deps
└── README.md                # Este arquivo
```

---

## 🔌 API REST - Especificação

### Autenticação

Todas as requisições devem incluir:
```http
Content-Type: application/json
Accept: application/json
```

Usuário é extraído do contexto (Firebase token no app).

### Endpoints

#### 1. Chat com IA
```http
POST /api/chat
Content-Type: application/json

{
  "pet": {
    "id": "pet-123",
    "name": "Rex",
    "species": "cachorro",
    "breed": "Labrador",
    "age": "3 anos",
    "weight": "30kg",
    "vaccines": [...],
    "medications": [...]
  },
  "message": "Meu pet está vomitando. O que fazer?",
  "history": [
    {"role": "user", "message": "..."},
    {"role": "assistant", "message": "..."}
  ],
  "imageBase64": "data:image/jpeg;base64,..." // opcional
}

Response (200 OK):
{
  "reply": "Vômitos podem ter várias causas...",
  "urgency": "media",
  "suggestedAction": "agendar_consulta",
  "reason": "Vômitos contínuos indicam...",
  "sources": ["knowledge_chunk_1", "knowledge_chunk_2"],
  "alerts": [
    {
      "code": "VOMITING_DETECTED",
      "severity": "atencao",
      "title": "Vômitos detectados",
      "detail": "Seu pet apresentou vômitos...",
      "points": 15
    }
  ],
  "simulated": false
}
```

**Urgências:** `baixa`, `media`, `alta`, `emergencia`  
**Ações:** `nenhuma`, `cuidado_em_casa`, `agendar_consulta`, `atualizar_vacina`, `procurar_emergencia`

#### 2. Avaliação de Risco (Único Pet)
```http
POST /api/alerts
Content-Type: application/json

{
  "id": "pet-123",
  "name": "Rex",
  "species": "cachorro",
  "vaccines": [...],
  "medications": [...]
}

Response (200 OK):
{
  "petId": "pet-123",
  "petName": "Rex",
  "riskScore": 42,
  "riskLabel": "medio",
  "alerts": [
    {
      "code": "VAC_RAIVA_OVERDUE",
      "severity": "critico",
      "title": "Vacina antirrábica vencida",
      "detail": "Venceu há 2 meses",
      "dueDate": "2024-07-01",
      "points": 25
    }
  ]
}
```

#### 3. Avaliação em Lote
```http
POST /api/alerts/batch
Content-Type: application/json

[
  { "id": "pet-1", "name": "Rex", ... },
  { "id": "pet-2", "name": "Luna", ... }
]

Response (200 OK):
[
  { "petId": "pet-1", "riskScore": 42, ... },
  { "petId": "pet-2", "riskScore": 18, ... }
]
```

#### 4. Speech-to-Text
```http
POST /api/speech/transcribe
Content-Type: multipart/form-data

file: <binary audio file>

Response (200 OK):
{
  "text": "Meu pet está vomitando"
}
```

Formatos suportados: `wav`, `webm`, `m4a`, `mp4`, `ogg`, `3gp`

#### 5. Text-to-Speech
```http
GET /api/speech/synthesize?text=Seu%20pet%20precisa%20de%20uma%20consulta

Response (200 OK):
<audio/mpeg binary>
```

#### 6. Health Check
```http
GET /health

Response (200 OK):
{
  "status": "ok",
  "version": "1.0.0",
  "llm": {
    "enabled": true,
    "model": "claude-opus",
    "mode": "live"
  },
  "rag": {
    "backend": "chroma",
    "chunks": 1024
  },
  "stt": { "enabled": true, "model": "whisper-1" },
  "tts": { "enabled": true, "voiceId": "21m00Tcm4TlvDq8ikWAM" },
  "rpa": {
    "enabled": true,
    "schedule": "09:00",
    "timezone": "America/Sao_Paulo"
  }
}
```

---

## 🌐 Deployment no Render

### ✨ Status Atual

**A API do backend está publicada no Render!**

```
🔗 Endpoint: https://projeto-challenge-conversacional.onrender.com
📚 Docs: https://projeto-challenge-conversacional.onrender.com/docs
🏥 Health: https://projeto-challenge-conversacional.onrender.com/health
```

### Como foi feito

1. **Dockerfile** criado (`clyvo-ai-service/Dockerfile`)
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY Requirements.txt .
   RUN pip install --no-cache-dir -r Requirements.txt
   COPY app/ .
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Variáveis de Ambiente** configuradas no Render:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_VOICE_ID`
   - `CORS_ORIGINS`
   - E todas as outras do `.env`

3. **Build & Deploy**:
   - Render monitora o repositório GitHub
   - Detecta mudanças no branch `main`
   - Rebuilda a Docker image
   - Reinicia o serviço automaticamente
   - Logs disponíveis no dashboard Render

### Conectar Frontend ao Backend Publicado

No arquivo `src/services/AiService.ts`, o `BASE_URL` já aponta para Render:

```typescript
const BASE_URL = "https://projeto-challenge-conversacional.onrender.com";
```

Quando o app for buildado para produção, ele automaticamente chamará a API pública.

### Monitorar Deployment

- **Render Dashboard**: https://dashboard.render.com
- **Logs em tempo real** da API
- **Métricas** de CPU, memória, requests
- **Alertas** para falhas ou timeouts

---

## 🧪 Testes

### Frontend (TypeScript)
```bash
npx tsc --noEmit         # Verificar tipos
npm test                 # Rodar testes (se configurado)
```

### Backend (Python)
```bash
cd clyvo-ai-service
pytest tests/            # Rodar suite de testes
pytest tests/test_llm.py # Teste específico
```

---

## 📱 Funcionalidades Principais

### 🐕 Pets (CRUD Completo)
- **Create**: Adicionar novo pet com foto e detalhes
- **Read**: Listar pets, visualizar detalhes
- **Update**: Editar perfil do pet
- **Delete**: Remover pet

### 💉 Saúde (Vacinas, Medicamentos, Checkups)
- **Vacinação**: Registrar vacinas, marcar como feito, alertas de vencimento
- **Medicamentos**: Dosagem, frequência, duração
- **Calendário**: Visualizar agenda de saúde mensal
- **Pendências**: Lista centralizada de ações pendentes

### 💬 Chat com IA
- **Assistente conversacional** 24/7
- **Análise de sintomas** via mensagem ou imagem
- **Sugestões de ações** (cuidado em casa, agendar, emergência)
- **Histórico** persistido localmente

### 🚨 Alertas Inteligentes
- **Vacinação**: Vencidas, próximas, faltando
- **Medicamentos**: Terminando, período de ação
- **Checkups**: Atrasados, próximos
- **Saúde**: Comportamento, apetite, energia

### 🔐 Autenticação (Firebase)
- Cadastro com email
- Login com email/senha
- Login com Google
- Verificação de email obrigatória
- Redefinição de senha

---

## 📚 Documentação Adicional

- **[DADOS_ESPECIFICACAO.md](./DADOS_ESPECIFICACAO.md)** - Estrutura completa de dados, fluxos, e conformidade
- **Diagramas de arquitetura** - Inclusos no relatório
- **API Docs** - Swagger em `/docs` quando backend está rodando

---


## 🛠️ Troubleshooting

### Erro: "API call failed"
- Verifique se `ANTHROPIC_API_KEY` está configurada
- Teste `/health` do backend: `curl https://projeto-challenge-conversacional.onrender.com/health`
- Verifique CORS: endpoint deve estar em `CORS_ORIGINS`

### Erro: "Firebase not initialized"
- Adicione credenciais Firebase no `src/services/firebase.ts`
- Verifique se `firebaseConfig` tem as chaves corretas

### Erro: "AsyncStorage not found"
- No web, AsyncStorage tem fallback para localStorage
- Em React Native, ensure está instalado: `npm install @react-native-async-storage/async-storage`

### Backend demora para responder
- Primeiro request pode levar ~30s (Render cold start)
- Requisições posteriores são rápidas
- Use `/health` para warm up

