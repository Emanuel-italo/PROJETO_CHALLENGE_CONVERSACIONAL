# CLYVO VET

Aplicativo mobile (Expo + React Native + TypeScript) para tutores acompanharem
a saúde de seus pets: cadastro de pets, vacinas, medicamentos, calendário de
saúde e um assistente de chat.

## Stack

- [Expo](https://expo.dev) / React Native 0.81 / React 19
- TypeScript (`strict: true`)
- [`@react-navigation`](https://reactnavigation.org) (native-stack + bottom-tabs)
- Firebase Authentication (login, cadastro, verificação de e-mail, login com
  Google, redefinição de senha)
- AsyncStorage como persistência local dos dados de negócio (pets, vacinas,
  medicamentos) — **temporário**: a troca para a API real via TanStack Query
  será feita em uma etapa separada.

## Scripts

```bash
npm start        # expo start
npm run android  # expo start --android
npm run ios      # expo start --ios
npm run web       # expo start --web
npx tsc --noEmit  # checagem de tipos
```

## Estrutura do Projeto

```
src/
├── components/        # Componentes de UI reutilizáveis (cards, inputs)
├── contexts/           # AuthContext (estado de sessão do Firebase)
├── hooks/
│   ├── useAuth.ts       # acesso ao AuthContext
│   ├── usePets.ts       # lista de pets (loading/error/reload)
│   ├── usePet.ts        # um pet por id — leitura, salvar (create/update), remover
│   ├── useVaccines.ts   # pets + CRUD de vacinas (loading/error/saving)
│   └── useMedications.ts# pets + CRUD de medicamentos (loading/error/saving)
├── interfaces/         # Contratos (IPetService, IStorage)
├── navigation/
│   ├── RootNavigator.tsx # troca entre Auth / Verificação de e-mail / App
│   └── MainTabs.tsx      # tabs principais (Dashboard, Pets, Saúde, Calendário, Perfil)
├── screens/
│   ├── auth/            # Welcome, Login, Register, VerifyEmail
│   ├── pet/              # PetsScreen, AddPetScreen (create + edit), PetDetailScreen, PetChatScreen
│   ├── health/            # HealthTabScreen, Vaccines, Medications, HealthCalendar,
│   │                       AddHealthRecord, Pending
│   ├── dashboard/         # DashboardScreen
│   └── profile/           # ProfileScreen
├── services/
│   ├── firebase.ts        # inicialização do Firebase App/Auth
│   ├── AuthService.ts      # regras de autenticação (Firebase)
│   ├── StorageService.ts   # persistência local (AsyncStorage) — dados de negócio
│   └── PetService.ts       # regras de pet sobre o StorageService
├── styles/              # StyleSheets por tela/componente (PascalCase, 1:1 com a tela)
├── types/               # Pet, Vaccine, Medication, RootStackParamList, MainTabParamList
└── utils/
    ├── validators.ts     # validações de formulário (e-mail, senha, telefone, pet)
    ├── formatters.ts      # formatação de datas, idade, status
    ├── showAlert.ts        # Alert cross-platform (nativo + web)
    └── authErrors.ts        # mapeamento de erros do Firebase Auth para mensagens em pt-BR
```

As telas são organizadas por **domínio** (`auth`, `pet`, `health`, `dashboard`,
`profile`), não por "tipo" (não existe mais uma pasta `main/` genérica). Isso
evita duplicidade de nomes/telas e deixa explícito a que parte do app cada tela
pertence.

## Funcionalidades

### Autenticação (Firebase)
- Cadastro, login, login com Google, verificação de e-mail obrigatória e
  redefinição de senha.
- Rotas protegidas: sem sessão válida o usuário só acessa o fluxo de
  autenticação; com sessão mas sem e-mail verificado, fica preso na tela de
  verificação.

### Pets (CRUD completo)
- **Create**: `AddPetScreen` (modo criação) cadastra um novo pet.
- **Read**: `PetsScreen` lista os pets do tutor; `PetDetailScreen` mostra
  detalhes, vacinas e medicamentos de um pet.
- **Update**: `AddPetScreen` também funciona em **modo edição** — acessível
  pelo botão "Editar" em `PetDetailScreen` — carregando os dados existentes do
  pet, prefiltrando o formulário e salvando as alterações via
  `petService.save()`.
- **Delete**: botão de remover em `PetDetailScreen`.

### Saúde
- `HealthTabScreen`: visão geral de saúde de todos os pets.
- `VaccinesScreen` / `MedicationsScreen`: cadastro, marcação de concluído/ativo
  e remoção de vacinas e medicamentos.
- `HealthCalendarScreen`: calendário mensal com vacinas/medicamentos e lista de
  pendências.
- `AddHealthRecordScreen`: atalho para registrar vacina ou medicamento.
- `PendingScreen`: vacinas pendentes.

### Chat
- `PetChatScreen`: histórico de conversa persistido localmente.

## Hooks de acesso a dados

Toda a leitura/escrita de pets, vacinas e medicamentos passa por hooks
dedicados (`usePets`, `usePet`, `useVaccines`, `useMedications`) em vez de as
telas chamarem `storageService`/`petService` diretamente. Cada hook expõe:

- `pets` / `pet` — os dados;
- `loading` — carregamento em andamento (exibido com `ActivityIndicator` nas
  telas);
- `error` — mensagem de erro específica, exibida na própria tela;
- `saving` (quando aplicável) — estado de uma operação de escrita em
  andamento;
- funções de ação (`addVaccine`, `toggleDone`, `removeVaccine`, `save`,
  `remove`, `reload`, etc.) que retornam `boolean` indicando sucesso, para a
  tela decidir como reagir (ex: `showAlert` com mensagem específica em caso de
  falha).

Essa camada isola a UI da fonte de dados: quando o `StorageService` for
substituído por chamadas à API real (TanStack Query), as telas não precisarão
mudar — apenas a implementação interna dos hooks.

## Validação de formulários

Os formulários (`AddPetScreen`, `RegisterScreen`, `LoginScreen`) usam as
funções de `src/utils/validators.ts` (`validarCampoObrigatorio`, `validarEmail`,
`validarTelefone`, `validarSenha`, `validarFormularioPet`,
`validarFormularioUsuario`) e exibem mensagens de erro específicas por campo,
em vez de apenas bloquear o envio silenciosamente.

## Próximos passos (fora do escopo atual)

- Substituir `StorageService`/`PetService` por chamadas à API real usando
  TanStack Query, mantendo a mesma interface consumida pelos hooks
  (`usePets`, `usePet`, `useVaccines`, `useMedications`).
