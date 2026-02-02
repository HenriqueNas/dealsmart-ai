import { LoginForm } from '@/app/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | DealSmart AI',
  description: 'Sign in to your DealSmart AI account',
};

export default function LoginPage() {
  return <LoginForm />;
}
