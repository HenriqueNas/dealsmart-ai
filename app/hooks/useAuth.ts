'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { useCallback } from 'react';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthError {
  message: string;
  code?: string;
}

export function useAuth() {
  const { data: session, status, update } = useSession();

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      // First call our API endpoint to validate and get user data
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!data.success) {
        const error: AuthError = {
          message: data.error?.message || 'Login failed',
          code: data.error?.code,
        };
        throw error;
      }

      // Then sign in with NextAuth to establish session
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        throw { message: 'Failed to establish session' } as AuthError;
      }
    },
    []
  );

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<void> => {
      // Call our API endpoint to register
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!data.success) {
        const error: AuthError = {
          message: data.error?.message || 'Registration failed',
          code: data.error?.code,
        };
        throw error;
      }

      // Then sign in with NextAuth to establish session
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        throw { message: 'Failed to establish session' } as AuthError;
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    // Call our API endpoint to clear server-side session
    await fetch('/api/v1/auth/logout', { method: 'POST' });

    // Then sign out with NextAuth
    await signOut({ redirect: false });
  }, []);

  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    register,
    logout,
    updateSession: update,
  };
}
