import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

import {
  buildPublicSession,
  refreshAccessToken,
  type ExtendedJWT,
  type OAuthProvider,
} from "./auth-helpers";

// The `declare module "next-auth"` augmentation lives in `auth-helpers.ts`
// (M3) — next to the only code that writes those fields.
export type { OAuthProvider, ExtendedJWT } from "./auth-helpers";
export { buildPublicSession, getServerAccessToken } from "./auth-helpers";

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

      // Access token expired — delegate to the shared refresh helper so the
      // server-route flow (getServerAccessToken) and the client-session flow
      // stay byte-for-byte identical.
      if (extendedToken.refreshToken) {
        return refreshAccessToken(extendedToken);
      }

      return extendedToken;
    },
    async session({ session, token }) {
      // SECURITY (PRO-C1): see buildPublicSession docstring — `accessToken` is
      // intentionally never copied here so it cannot leak via useSession() or
      // GET /api/auth/session.
      return buildPublicSession(session, token as ExtendedJWT);
    },
  },
  pages: {
    signIn: "/", // Redirect to home on sign in
  },
});
