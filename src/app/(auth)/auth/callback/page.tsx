"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

      // Handle error from Supabase
      if (errorParam) {
        setError(errorDescription || errorParam);
        setTimeout(() => router.push("/login?error=" + errorParam), 2000);
        return;
      }

      try {
        // Case 1: PKCE flow with code
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // Case 2: Implicit flow with access_token (from invite/magic link)
        else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }
        // No valid auth params
        else {
          throw new Error("Paramètres d'authentification manquants");
        }

        // Check the type to determine where to redirect
        if (type === "invite" || type === "recovery") {
          // For invites and password recovery, go to reset password page
          router.push("/reset-password");
        } else {
          // For other cases (magic link login, etc.), go to home
          router.push("/");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError(err instanceof Error ? err.message : "Erreur d'authentification");
        setTimeout(() => router.push("/login?error=auth_callback_error"), 2000);
      }
    };

    handleCallback();
  }, [router]);

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
            <p className="text-muted-foreground">Connexion en cours...</p>
          </div>
        )}
      </div>
    </div>
  );
}
