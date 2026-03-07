"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Connexion en cours...");
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    // Parse hash fragment
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    // If no tokens in hash, redirect to login
    if (!accessToken || !refreshToken) {
      window.location.replace("/login");
      return;
    }

    const supabase = createClient();

    // Use onAuthStateChange to detect when session is ready
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("Redirection...");

        // Unsubscribe before redirecting
        subscription.unsubscribe();

        // Redirect based on type
        if (type === "invite" || type === "recovery") {
          window.location.replace("/reset-password");
        } else {
          window.location.replace("/");
        }
      }
    });

    // Set up the session manually with the tokens from hash
    const setupSession = async () => {
      try {
        setStatus("Configuration de la session...");

        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          throw sessionError;
        }

        if (!data?.session) {
          throw new Error("Session non créée");
        }

        // Give onAuthStateChange a moment to fire, then redirect directly as fallback
        setTimeout(() => {
          subscription.unsubscribe();
          if (type === "invite" || type === "recovery") {
            window.location.replace("/reset-password");
          } else {
            window.location.replace("/");
          }
        }, 500);
      } catch (err) {
        console.error("[Callback] Error:", err);
        subscription.unsubscribe();
        setError(err instanceof Error ? err.message : "Erreur d'authentification");
        setTimeout(() => {
          window.location.replace("/login?error=auth_callback_error");
        }, 2000);
      }
    };

    setupSession();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="space-y-2">
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground">Redirection en cours...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
