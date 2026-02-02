'use client';

interface PasswordStrengthIndicatorProps {
  password: string;
}

function calculateStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Normalize to 0-4 scale
  const normalizedScore = Math.min(Math.floor((score / 6) * 4), 4);

  const levels = [
    { label: 'Very weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-lime-500' },
    { label: 'Strong', color: 'bg-[#0aff64]' },
  ];

  return {
    score: normalizedScore,
    label: levels[normalizedScore].label,
    color: levels[normalizedScore].color,
  };
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const { score, label, color } = calculateStrength(password);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index <= score ? color : 'bg-foreground/10'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className="text-xs text-foreground/60">
        Password strength: <span className="font-medium">{label}</span>
      </p>

      {/* Requirements */}
      <div className="mt-1 space-y-0.5 text-xs text-foreground/50">
        <p className={password.length >= 8 ? 'text-[#0aff64]' : ''}>
          {password.length >= 8 ? '✓' : '○'} At least 8 characters
        </p>
        <p className={/[A-Z]/.test(password) ? 'text-[#0aff64]' : ''}>
          {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
        </p>
        <p className={/[a-z]/.test(password) ? 'text-[#0aff64]' : ''}>
          {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
        </p>
        <p className={/[0-9]/.test(password) ? 'text-[#0aff64]' : ''}>
          {/[0-9]/.test(password) ? '✓' : '○'} One number
        </p>
      </div>
    </div>
  );
}
