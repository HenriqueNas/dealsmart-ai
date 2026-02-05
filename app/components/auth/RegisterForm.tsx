'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { registerSchema } from '@/lib/schemas/auth.schema';
import { Eye, EyeClosed } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '../ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/Card';
import { Input } from '../ui/Input';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    const result = registerSchema.safeParse({ name, email, password });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await register({ name, email, password });
      router.push('/profile');
    } catch (error) {
      const err = error as { message?: string };
      setErrors({
        general: err.message || 'Registration failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Get started with DealSmart AI today</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errors.general && (
            <div className="rounded-none bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errors.general}
            </div>
          )}

          <Input
            type="text"
            label="Name"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            error={errors.name}
            disabled={isLoading}
            autoComplete="name"
          />

          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
            disabled={isLoading}
            autoComplete="email"
            icon={
              showPassword ? (
                <Eye
                  className="cursor-pointer"
                  onClick={togglePasswordVisibility}
                />
              ) : (
                <EyeClosed
                  className="cursor-pointer"
                  onClick={togglePasswordVisibility}
                />
              )
            }
          />

          <div className="flex flex-col gap-2">
            <Input
              type="password"
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={errors.password}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <PasswordStrengthIndicator password={password} />
          </div>

          <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
            Create account
          </Button>

          <p className="text-center text-sm text-foreground/60">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-accent hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
