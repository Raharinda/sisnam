import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => {
    setUser(nextUser);
    setLoading(false);
  }), []);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    },
    logout: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}
