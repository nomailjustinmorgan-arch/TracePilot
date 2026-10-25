import { useEffect, useState } from 'react';
import {
  Plus,
  FileSearch,
  ChevronRight,
  Clock,
  Server,
  AlertCircle,
  CheckCircle2,
  Loader,
  Inbox,
} from 'lucide-react';
import { Link } from '@/lib/router';
import { api } from '@/lib/api';
import { ensureSeedData } from '@/lib/seed';
import type { Incident } from '@/lib/types';
import { formatRelativeTime } from '@/lib/format';
import { Badge, severityBadgeVariant, statusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

export function OverviewPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureSeedData();
      const data = await api.listIncidents();
      setIncidents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investigations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = {
    total: incidents.length,
    investigating: incidents.filter((i) => i.status === 'Investigating').length,
    actionRequired: incidents.filter((i) => i.status === 'Action Required').length,
    resolved: incidents.filter((i) => i.status === 'Resolved').length,
  };

  const sorted = [...incidents].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Incident command center</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Turn an incident report into an organised investigation. Separate observed facts from
          assumptions, track evidence, and guide your team toward verifiable actions.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link to="/incidents/new">
          <Button variant="primary" size="lg">
            <Plus className="h-4 w-4" />
            New Investigation
          </Button>
        </Link>
        <p className="text-xs text-slate-600">
          {counts.total} {counts.total === 1 ? 'investigation' : 'investigations'} tracked
        </p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={<FileSearch className="h-4 w-4" />}
          label="Total"
          value={counts.total}
          color="text-slate-300"
          bg="bg-base-800/60"
        />
        <SummaryCard
          icon={<Loader className="h-4 w-4" />}
          label="Investigating"
          value={counts.investigating}
          color="text-electric-400"
          bg="bg-electric-500/5"
        />
        <SummaryCard
          icon={<AlertCircle className="h-4 w-4" />}
          label="Action Required"
          value={counts.actionRequired}
          color="text-warning-400"
          bg="bg-warning-500/5"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Resolved"
          value={counts.resolved}
          color="text-success-400"
          bg="bg-success-500/5"
        />
      </div>

      {/* Investigations list */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Recent investigations</h2>
        {loading ? (
          <LoadingState message="Loading investigations…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-slate-700/40 bg-base-850/60">
            <EmptyState
              icon={<Inbox className="h-7 w-7 text-slate-600" />}
              title="No investigations yet"
              message="Create your first investigation to start tracking evidence, findings, and actions."
              action={
                <Link to="/incidents/new">
                  <Button variant="primary" size="md" className="mt-2">
                    <Plus className="h-4 w-4" />
                    Start an investigation
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-2.5">
            {sorted.map((incident, idx) => (
              <IncidentRow key={incident.id} incident={incident} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-700/40 ${bg} p-4 transition-base hover:border-slate-600/50`}>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className={color}>{icon}</span>
        {label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function IncidentRow({ incident, index }: { incident: Incident; index: number }) {
  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="block animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}
    >
      <div className="group rounded-xl border border-slate-700/40 bg-base-850/60 p-4 transition-base hover:border-accent-500/30 hover:bg-base-800/60 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-accent-400 transition-base">
                {incident.title}
              </h3>
              {incident.is_demo && (
                <Badge variant="demo">Demo</Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5" />
                {incident.affected_service}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatRelativeTime(incident.updated_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={severityBadgeVariant(incident.severity)}>
              {incident.severity}
            </Badge>
            <Badge variant={statusBadgeVariant(incident.status)}>
              {incident.status}
            </Badge>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-accent-400 transition-base" />
          </div>
        </div>
      </div>
    </Link>
  );
}
