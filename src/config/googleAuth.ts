// Web Client ID do Google OAuth para o projeto Firebase "clyvo-vet-a0a28".
// Pegue em: Firebase Console > Authentication > Sign-in method > Google >
// "Web SDK configuration" (depois de ativar o provedor Google).
export const GOOGLE_WEB_CLIENT_ID =
  "COLE_AQUI_O_WEB_CLIENT_ID.apps.googleusercontent.com";

// Enquanto o Client ID acima não for preenchido com um valor real, o login
// com Google não tem como funcionar (o provedor Google rejeita a requisição).
// Usado para falhar de forma clara em vez de abrir o navegador numa tela de
// erro do próprio Google.
export const isGoogleAuthConfigured = !GOOGLE_WEB_CLIENT_ID.startsWith(
  "COLE_AQUI_",
);
