import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading data. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-500/10 border border-danger-500/20">
        <AlertTriangle className="h-6 w-6 text-danger-400" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-200">{title}</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-accent-400 hover:text-accent-300 transition-base cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-800 border border-slate-700/40">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-slate-200">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">{message}</p>
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-500/30 border-t-accent-400" />
      <span className="text-sm text-slate-500">{message}</span>
    </div>
  );
}
