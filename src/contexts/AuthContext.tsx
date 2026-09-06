import React, { ReactNode, createContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";

import { authService } from "../services/AuthService";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateEmailAddress: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  refreshEmailVerified: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
};

function mapUser(firebaseUser: FirebaseUser | null): AuthUser | null {
  if (!firebaseUser) return null;

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    emailVerified: firebaseUser.emailVerified,
  };
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
      setUser(mapUser(firebaseUser));
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login(email, password);
  };

  const loginWithGoogle = async (idToken: string) => {
    await authService.loginWithGoogle(idToken);
  };

  const register = async (name: string, email: string, password: string) => {
    await authService.register(name, email, password);
  };

  const logout = async () => {
    await authService.logout();
  };

  const updateName = async (name: string) => {
    await authService.updateName(name);
    setUser((current) =>
      current ? { ...current, displayName: name.trim() } : current,
    );
  };

  const updateEmailAddress = async (email: string) => {
    await authService.updateEmailAddress(email);
    setUser((current) =>
      current ? { ...current, email: email.trim().toLowerCase() } : current,
    );
  };

  const sendVerificationEmail = async () => {
    await authService.sendVerificationEmail();
  };

  const refreshEmailVerified = async () => {
    const refreshedUser = await authService.reloadUser();
    setUser(mapUser(refreshedUser));

    return refreshedUser.emailVerified;
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        initializing,
        login,
        loginWithGoogle,
        register,
        logout,
        updateName,
        updateEmailAddress,
        sendVerificationEmail,
        refreshEmailVerified,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
