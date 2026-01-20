"use client";

import { createContext, useContext } from "react";
import { useAuth, type AuthUser } from "@/hooks/use-auth";
import { useAuthSync } from "@/hooks/use-auth-sync";
import type { Session } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/supabase";

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Synchronisation cross-tab des sessions auth
  useAuthSync();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
