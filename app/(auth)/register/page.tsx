import { RegisterForm } from '@/app/components/auth/RegisterForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | DealSmart AI',
  description: 'Create your DealSmart AI account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
