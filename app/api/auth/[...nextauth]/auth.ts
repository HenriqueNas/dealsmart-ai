import type { Role } from '@/infra/prisma/generated/client';
import { prisma } from '@/infra/prisma/prisma';
import { loginSchema } from '@/lib/schemas/auth.schema';
import { authService } from '@/server/services/auth.service';
import { PrismaAdapter } from '@auth/prisma-adapter';

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import HubspotProvider from 'next-auth/providers/hubspot';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: Role;
      verified: boolean;
      ageVerified: boolean;
    };
  }

  interface User {
    role: Role;
    verified: boolean;
    ageVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    verified: boolean;
    ageVerified: boolean;
  }
}

const providers = [];

// Add HubSpot OAuth provider if configured
if (process.env.HUBSPOT_CLIENT_ID && process.env.HUBSPOT_CLIENT_SECRET) {
  providers.push(
    HubspotProvider({
      clientId: process.env.HUBSPOT_CLIENT_ID,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    })
  );
}

// Always add Credentials provider
providers.push(
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      try {
        const parsed = loginSchema.parse(credentials);
        const user = await authService.validateCredentials(parsed);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          verified:
            (user as unknown as { verified?: boolean }).verified ?? false,
          ageVerified:
            (user as unknown as { ageVerified?: boolean }).ageVerified ?? false,
        };
      } catch {
        return null;
      }
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.verified = user.verified;
        token.ageVerified = user.ageVerified;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
        token.image = session.image ?? token.image;
        token.verified = session.verified ?? token.verified;
        token.ageVerified = session.ageVerified ?? token.ageVerified;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.verified = token.verified;
        session.user.ageVerified = token.ageVerified;
      }
      return session;
    },
  },
});
