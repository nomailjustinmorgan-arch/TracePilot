import { useEffect, useState } from 'react';
import { Plus, ChevronRight, Clock, Server, Inbox } from 'lucide-react';
import { Link } from '@/lib/router';
import { api } from '@/lib/api';
import { ensureSeedData } from '@/lib/seed';
import type { Incident } from '@/lib/types';
import { formatRelativeTime } from '@/lib/format';
import { Badge, severityBadgeVariant, statusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';

export function InvestigationsListPage() {
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

  const sorted = [...incidents].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Investigations</h1>
          <p className="mt-1 text-sm text-slate-400">All incident investigations, sorted by most recent activity.</p>
        </div>
        <Link to="/incidents/new">
          <Button variant="primary" size="md">
            <Plus className="h-4 w-4" />
            New Investigation
          </Button>
        </Link>
      </div>

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
            <Link key={incident.id} to={`/incidents/${incident.id}`} className="block animate-fade-in-up" style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}>
              <div className="group rounded-xl border border-slate-700/40 bg-base-850/60 p-4 transition-base hover:border-accent-500/30 hover:bg-base-800/60 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-accent-400 transition-base">
                        {incident.title}
                      </h3>
                      {incident.is_demo && <Badge variant="demo">Demo</Badge>}
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
                    <Badge variant={severityBadgeVariant(incident.severity)}>{incident.severity}</Badge>
                    <Badge variant={statusBadgeVariant(incident.status)}>{incident.status}</Badge>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-accent-400 transition-base" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
