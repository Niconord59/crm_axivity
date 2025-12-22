import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { JWT } from "next-auth/jwt";

export type OAuthProvider = "google" | "microsoft";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    provider?: OAuthProvider;
  }
}

// Extend JWT type with our custom properties
interface ExtendedJWT extends JWT {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  provider?: OAuthProvider;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_SECRET!,
      // Use "common" tenant to support both personal and work/school accounts
      issuer: "https://login.microsoftonline.com/common/v2.0",
      authorization: {
        params: {
          scope: "openid email profile User.Read Calendars.ReadWrite Mail.Send offline_access",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }): Promise<ExtendedJWT> {
      const extendedToken = token as ExtendedJWT;

      // Initial sign in
      if (account) {
        // Determine provider from account
        const provider: OAuthProvider = account.provider === "microsoft-entra-id" ? "microsoft" : "google";

        return {
          ...extendedToken,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          provider,
        };
      }

      // Return previous token if the access token has not expired yet
      if (extendedToken.expiresAt && Date.now() < extendedToken.expiresAt * 1000) {
        return extendedToken;
      }

      // Access token has expired, try to refresh it
      if (extendedToken.refreshToken) {
        try {
          const isGoogle = extendedToken.provider === "google";

          // Different token endpoints for each provider
          const tokenUrl = isGoogle
            ? "https://oauth2.googleapis.com/token"
            : "https://login.microsoftonline.com/common/oauth2/v2.0/token";

          const body = isGoogle
            ? new URLSearchParams({
                client_id: process.env.AUTH_GOOGLE_ID!,
                client_secret: process.env.AUTH_GOOGLE_SECRET!,
                grant_type: "refresh_token",
                refresh_token: extendedToken.refreshToken,
              })
            : new URLSearchParams({
                client_id: process.env.AUTH_MICROSOFT_ID!,
                client_secret: process.env.AUTH_MICROSOFT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: extendedToken.refreshToken,
                scope: "openid email profile User.Read Calendars.ReadWrite Mail.Send offline_access",
              });

          const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
          });

          const tokens = await response.json();

          if (!response.ok) {
            throw tokens;
          }

          return {
            ...extendedToken,
            accessToken: tokens.access_token,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
            // Keep the refresh token if a new one wasn't provided
            refreshToken: tokens.refresh_token ?? extendedToken.refreshToken,
          };
        } catch (error) {
          console.error("Error refreshing access token", error);
          return { ...extendedToken, error: "RefreshTokenError" };
        }
      }

      return extendedToken;
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;
      session.accessToken = extendedToken.accessToken;
      session.error = extendedToken.error;
      session.provider = extendedToken.provider;
      return session;
    },
  },
  pages: {
    signIn: "/", // Redirect to home on sign in
  },
});
