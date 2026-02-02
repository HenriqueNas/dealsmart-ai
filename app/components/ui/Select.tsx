'use client';

import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, className = '', id: providedId, children, ...props },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-foreground/90"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={`
              w-full px-3 py-2 pr-10
              bg-background
              border rounded-none
              text-foreground
              appearance-none
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background
              ${
                error
                  ? 'border-red-500 focus:ring-red-500/50'
                  : 'border-foreground/20 focus:ring-accent/50 focus:border-accent'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60 pointer-events-none"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-sm text-foreground/60">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
