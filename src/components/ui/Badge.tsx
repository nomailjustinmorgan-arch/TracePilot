import type { ReactNode } from 'react';

type Variant = 'default' | 'severity-low' | 'severity-medium' | 'severity-high' | 'severity-critical' |
  'status-draft' | 'status-investigating' | 'status-action' | 'status-resolved' |
  'demo' | 'outline';

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-base-700 text-slate-300 border border-slate-600/40',
  'severity-low': 'bg-success-500/10 text-success-400 border border-success-500/20',
  'severity-medium': 'bg-warning-500/10 text-warning-400 border border-warning-500/20',
  'severity-high': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  'severity-critical': 'bg-danger-500/10 text-danger-400 border border-danger-500/30',
  'status-draft': 'bg-slate-600/20 text-slate-400 border border-slate-500/30',
  'status-investigating': 'bg-electric-500/10 text-electric-400 border border-electric-500/20',
  'status-action': 'bg-warning-500/10 text-warning-400 border border-warning-500/20',
  'status-resolved': 'bg-success-500/10 text-success-400 border border-success-500/20',
  demo: 'bg-accent-500/10 text-accent-400 border border-accent-500/20',
  outline: 'bg-transparent text-slate-400 border border-slate-600/40',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function severityBadgeVariant(severity: string): Variant {
  const map: Record<string, Variant> = {
    Low: 'severity-low',
    Medium: 'severity-medium',
    High: 'severity-high',
    Critical: 'severity-critical',
  };
  return map[severity] ?? 'default';
}

export function statusBadgeVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Draft: 'status-draft',
    Investigating: 'status-investigating',
    'Action Required': 'status-action',
    Resolved: 'status-resolved',
  };
  return map[status] ?? 'default';
}
