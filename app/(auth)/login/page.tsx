import { LoginForm } from '@/app/components/auth/LoginForm';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Login | DealSmart AI',
  description: 'Sign in to your DealSmart AI account',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
