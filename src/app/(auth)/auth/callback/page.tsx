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
    if (hasRun.current) {
      console.log("[Callback] Already running, skipping...");
      return;
    }
    hasRun.current = true;

    const handleCallback = async () => {
      const supabase = createClient();

      // Get the hash fragment (contains access_token for implicit flow)
      const hashParams = new URLSearchParams(
        window.location.hash.substring(1) // Remove the '#'
      );

      // Also check query params (for PKCE flow)
      const queryParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type") || queryParams.get("type");
      const code = queryParams.get("code");
      const errorParam = queryParams.get("error");
      const errorDescription = queryParams.get("error_description");

      console.log("[Callback] type:", type, "hasToken:", !!accessToken, "hasCode:", !!code);

      // Handle error from Supabase
      if (errorParam) {
        setError(errorDescription || errorParam);
        setTimeout(() => window.location.href = "/login?error=" + errorParam, 2000);
        return;
      }

      try {
        // Case 1: PKCE flow with code
        if (code) {
          setStatus("Échange du code...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // Case 2: Implicit flow with access_token (from invite/magic link)
        else if (accessToken && refreshToken) {
          setStatus("Configuration de la session...");
          console.log("[Callback] Setting session with tokens...");

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          console.log("[Callback] setSession result:", { data, error });

          if (error) {
            console.error("[Callback] setSession error:", error);
            throw error;
          }

          console.log("[Callback] Session set successfully, user:", data?.user?.email);
        }
        // No valid auth params
        else {
          throw new Error("Paramètres d'authentification manquants");
        }

        // Wait a moment for cookies to be set
        setStatus("Redirection...");
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check the type to determine where to redirect
        // Use window.location.href for full page reload to ensure cookies are sent
        if (type === "invite" || type === "recovery") {
          console.log("[Callback] Redirecting to /reset-password");
          window.location.href = "/reset-password";
        } else {
          console.log("[Callback] Redirecting to /");
          window.location.href = "/";
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Erreur d'authentification");
        setTimeout(() => window.location.href = "/login?error=auth_callback_error", 2000);
      }
    };

    handleCallback();
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
