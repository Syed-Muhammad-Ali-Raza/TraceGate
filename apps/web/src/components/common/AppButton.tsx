'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  children: ReactNode;
};

export function AppButton({
  variant = 'primary',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: AppButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50';
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'border border-border bg-card text-foreground hover:bg-background',
    ghost: 'text-foreground hover:bg-card',
  };

  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
