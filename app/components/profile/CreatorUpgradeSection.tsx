'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { inviteCodeSchema } from '@/lib/schemas/invite.schema';
import { useCallback, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/Card';
import { Input } from '../ui/Input';
import { parse } from 'node:path';

interface FormErrors {
  code?: string;
  general?: string;
}

interface ValidationResult {
  valid: boolean;
  targetRole?: string;
  message?: string;
}

export function CreatorUpgradeSection() {
  const { user, updateSession } = useAuth();
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const validateCode = useCallback(async (codeToValidate: string) => {
    // First check format
    const parseResult = inviteCodeSchema.safeParse(codeToValidate);

    if (!parseResult.success) {
      setValidationResult({ valid: false, message: 'Invalid code format' });
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch(`/api/v1/invites/${codeToValidate}`);
      const data = await res.json();

      if (data.success) {
        setValidationResult({
          valid: data.data.valid,
          targetRole: data.data.targetRole,
          message: data.data.valid ? undefined : data.data.message,
        });
      } else {
        setValidationResult({
          valid: false,
          message: 'Failed to validate code',
        });
      }
    } catch {
      setValidationResult({ valid: false, message: 'Failed to validate code' });
    } finally {
      setIsValidating(false);
    }
  }, []);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCode = e.target.value.toUpperCase();
    setCode(newCode);
    setErrors({});
    setSuccessMessage('');
    setValidationResult(null);
  };

  const handleCodeBlur = () => {
    if (code.length > 0) {
      validateCode(code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');

    // Validate format
    const parseResult = inviteCodeSchema.safeParse(code);
    if (!parseResult.success) {
      setErrors({
        code: 'Invalid invite code format. Expected: DSA-XXXX-XXXX',
      });
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await fetch('/api/v1/invites/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to redeem code');
      }

      // Update session with new role
      await updateSession({ role: data.data.user.role });
      setSuccessMessage(
        `Congratulations! You are now a ${data.data.user.role}`
      );
      setCode('');
      setValidationResult(null);
    } catch (error) {
      const err = error as Error;
      setErrors({ general: err.message || 'Failed to redeem invite code' });
    } finally {
      setIsRedeeming(false);
    }
  };

  // Only show for USER role
  if (!user || user.role !== 'USER') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Upgrade to Creator
          <Badge variant="success">Invite Only</Badge>
        </CardTitle>
        <CardDescription>
          Enter an invite code from an admin to upgrade your account to Creator
          status
        </CardDescription>
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

          <div className="flex flex-col gap-2">
            <Input
              type="text"
              label="Invite Code"
              placeholder="DSA-XXXX-XXXX"
              value={code}
              onChange={handleCodeChange}
              onBlur={handleCodeBlur}
              error={errors.code}
              disabled={isRedeeming}
              className="font-mono uppercase tracking-wider"
            />

            {/* Validation status */}
            {isValidating && (
              <p className="text-sm text-foreground/60">Validating code...</p>
            )}

            {validationResult && !isValidating && (
              <div
                className={`text-sm ${
                  validationResult.valid ? 'text-accent' : 'text-red-400'
                }`}
              >
                {validationResult.valid ? (
                  <span>
                    ✓ Valid code - will grant {validationResult.targetRole} role
                  </span>
                ) : (
                  <span>✗ {validationResult.message || 'Invalid code'}</span>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            isLoading={isRedeeming}
            disabled={!validationResult?.valid}
            className="w-full sm:w-auto"
          >
            Redeem Code
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
