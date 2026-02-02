'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { updateUserSchema } from '@/lib/schemas/user.schema';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/Card';
import { Input } from '../ui/Input';

interface FormErrors {
  name?: string;
  general?: string;
}

export function EditProfileForm() {
  const { user, updateSession } = useAuth();
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize form with user data
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    // Validate with Zod
    const result = updateUserSchema.safeParse({ name });
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
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Update failed');
      }

      // Update the session with new data
      await updateSession({ name });
      setSuccessMessage('Profile updated successfully');
    } catch (error) {
      const err = error as Error;
      setErrors({ general: err.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errors.general && (
            <div className="rounded-none bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errors.general}
            </div>
          )}

          {successMessage && (
            <div className="rounded-none bg-accent/10 px-4 py-3 text-sm text-accent">
              {successMessage}
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
          />

          <Input
            type="email"
            label="Email"
            value={user.email}
            disabled
            hint="Email cannot be changed"
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
