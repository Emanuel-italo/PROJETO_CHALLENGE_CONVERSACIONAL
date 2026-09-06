import {
  GoogleAuthProvider,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updateProfile,
} from "firebase/auth";

import { auth } from "./firebase";

class AuthService {
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  async login(email: string, password: string): Promise<FirebaseUser> {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );

    return credential.user;
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<FirebaseUser> {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim().toLowerCase(),
      password,
    );

    await updateProfile(credential.user, { displayName: name.trim() });

    try {
      await sendEmailVerification(credential.user);
    } catch (error) {
      console.warn("Falha ao enviar e-mail de verificação no cadastro:", error);
    }

    return credential.user;
  }

  async loginWithGoogle(idToken: string): Promise<FirebaseUser> {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);

    return result.user;
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async sendVerificationEmail(): Promise<void> {
    if (!auth.currentUser) throw new Error("Nenhum usuário autenticado.");

    await sendEmailVerification(auth.currentUser);
  }

  async reloadUser(): Promise<FirebaseUser> {
    if (!auth.currentUser) throw new Error("Nenhum usuário autenticado.");

    await reload(auth.currentUser);

    return auth.currentUser;
  }

  async updateName(name: string): Promise<void> {
    if (!auth.currentUser) throw new Error("Nenhum usuário autenticado.");

    await updateProfile(auth.currentUser, { displayName: name.trim() });
  }

  async updateEmailAddress(email: string): Promise<void> {
    if (!auth.currentUser) throw new Error("Nenhum usuário autenticado.");

    await updateEmail(auth.currentUser, email.trim().toLowerCase());
  }
}

export const authService = new AuthService();
