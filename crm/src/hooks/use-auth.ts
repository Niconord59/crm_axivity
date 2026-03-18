"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string | null;
  role: UserRole;
  avatarUrl: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  // Fetch user profile from profiles table
  const fetchProfile = useCallback(async (userId: string, email: string): Promise<AuthUser | null> => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      // If no profile exists, return basic info from auth
      return {
        id: userId,
        email: email,
        nom: email.split("@")[0],
        prenom: null,
        role: "client" as UserRole,
        avatarUrl: null,
      };
    }

    return {
      id: profile.id,
      email: profile.email || email,
      nom: profile.nom || email.split("@")[0],
      prenom: profile.prenom,
      role: profile.role as UserRole,
      avatarUrl: profile.avatar_url,
    };
  }, [supabase]);

  // Initialize auth state via onAuthStateChange only.
  //
  // CRITICAL: This callback must NOT be async and must NOT await any
  // supabase.from().select() calls. GoTrue's _notifyAllSubscribers()
  // awaits all callbacks while holding an internal lock. If a callback
  // calls getSession() (which supabase.from().select() does internally
  // via _getAccessToken), it tries to acquire the same lock → DEADLOCK.
  // Using .then() lets the callback return immediately, releasing the lock.
  useEffect(() => {
    let isFirstEvent = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (session?.user) {
          // Use .then() instead of await to avoid deadlocking GoTrue's lock.
          // fetchProfile() calls supabase.from("profiles").select() which
          // internally calls getSession() → _acquireLock(). If we awaited here,
          // the lock held by _notifyAllSubscribers would never be released.
          fetchProfile(session.user.id, session.user.email || "").then(profile => {
            setUser(profile);
            // Mark loading complete AFTER profile is fetched, so isAdmin()
            // is accurate when pages check !isLoading && !isAdmin().
            if (isFirstEvent) {
              isFirstEvent = false;
              setIsLoading(false);
            }
          });
        } else {
          setUser(null);
          // No session = no profile to fetch, loading is done
          if (isFirstEvent) {
            isFirstEvent = false;
            setIsLoading(false);
          }
        }

        // Handle specific events
        if (event === "SIGNED_OUT") {
          router.push("/login");
          router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, fetchProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  // Check if user has a specific role
  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    return hasRole("admin");
  }, [hasRole]);

  // Check if user is admin or developpeur
  const isManager = useCallback((): boolean => {
    return hasRole(["admin", "developpeur_nocode", "developpeur_automatisme"]);
  }, [hasRole]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    hasRole,
    isAdmin,
    isManager,
  };
}

// Hook to get current user (for server components via context)
export function useCurrentUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}
