import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent-500 text-base-950 hover:bg-accent-400 active:bg-accent-600 font-semibold shadow-glow',
  secondary:
    'bg-base-700 text-slate-200 hover:bg-base-600 border border-slate-600/50',
  ghost:
    'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-base-700/50',
  danger:
    'bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 border border-danger-500/30',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-lg gap-2',
  lg: 'text-base px-5 py-3 rounded-lg gap-2',
};

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'secondary',
  size = 'md',
  disabled,
  className = '',
  fullWidth,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium transition-base ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
