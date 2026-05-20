import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { NextRequest } from "next/server";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL, "http://localhost:3000"]
    : ["http://localhost:3000"],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

export interface AuthUser {
  id: string;
  email: string;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session) return null;
  return { id: session.user.id, email: session.user.email };
}
