import type { NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const providers = [];

if (process.env.AUTH_GOOGLE_CLIENT_ID && process.env.AUTH_GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET
    })
  );
}

if (process.env.AUTH_GITHUB_CLIENT_ID && process.env.AUTH_GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET
    })
  );
}

export const oauthAuthOptions: NextAuthOptions = {
  // NextAuth v4 reads NEXTAUTH_SECRET by convention; accept the existing
  // AUTH_SECRET name as a backwards-compatible fallback.
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers,
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.oauthProvider = account.provider;
        token.oauthProviderAccountId = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.oauthProvider = typeof token.oauthProvider === "string" ? token.oauthProvider : undefined;
        session.user.oauthProviderAccountId =
          typeof token.oauthProviderAccountId === "string" ? token.oauthProviderAccountId : undefined;
      }
      return session;
    }
  }
};
