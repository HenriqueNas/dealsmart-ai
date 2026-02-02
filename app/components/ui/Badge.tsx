type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-foreground/10 text-foreground',
  success: 'bg-accent/20 text-accent',
  warning: 'bg-yellow-500/20 text-yellow-400',
  danger: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
};

export function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5
        text-xs font-medium
        rounded-full
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Pre-styled role badges
export function RoleBadge({ role }: { role: 'USER' | 'CREATOR' | 'ADMIN' }) {
  const variants: Record<string, BadgeVariant> = {
    USER: 'default',
    CREATOR: 'success',
    ADMIN: 'info',
  };

  return <Badge variant={variants[role]}>{role}</Badge>;
}

// Status badge for verification
export function StatusBadge({
  verified,
  label,
}: {
  verified: boolean;
  label?: string;
}) {
  return (
    <Badge variant={verified ? 'success' : 'warning'}>
      {label || (verified ? 'Verified' : 'Unverified')}
    </Badge>
  );
}
