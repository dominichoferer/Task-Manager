import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30',
    secondary: 'bg-white/10 text-white/70 border border-white/10',
    destructive: 'bg-red-600/20 text-red-300 border border-red-500/30',
    outline: 'border border-white/20 text-white/70',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
