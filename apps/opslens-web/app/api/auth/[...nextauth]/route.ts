import NextAuth from "next-auth";
import { oauthAuthOptions } from "@/lib/auth/oauth";

const handler = NextAuth(oauthAuthOptions);

export { handler as GET, handler as POST };
