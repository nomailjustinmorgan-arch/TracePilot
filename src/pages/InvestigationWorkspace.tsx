import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Server,
  Clock,
  Calendar,
  Pencil,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Link } from '@/lib/router';
import { api } from '@/lib/api';
import {
  type IncidentDetail,
  type IncidentStatus,
  type Severity,
  type Environment,
  type AIAnalysisRun,
  INCIDENT_STATUSES,
  SEVERITIES,
  ENVIRONMENTS,
} from '@/lib/types';
import { formatDateTime, formatRelativeTime, toDatetimeLocal } from '@/lib/format';
import { Badge, severityBadgeVariant, statusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { EvidenceLedger } from '@/components/workspace/EvidenceLedger';
import { FindingsPanel } from '@/components/workspace/FindingsPanel';
import { ActionPlan } from '@/components/workspace/ActionPlan';
import { AIIntegrationPanel } from '@/components/workspace/AIIntegrationPanel';
import { ResearchPanel } from '@/components/workspace/ResearchPanel';

export function InvestigationWorkspace({ id }: { id: string }) {
  const [data, setData] = useState<IncidentDetail | null>(null);
  const [aiRuns, setAIRuns] = useState<AIAnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const [detail, runs] = await Promise.all([
        api.getIncidentDetail(id),
        api.getAIAnalysisRuns(id),
      ]);
      if (!detail) {
        setNotFound(true);
        return;
      }
      setData(detail);
      setAIRuns(runs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investigation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState message="Loading investigation…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (notFound || !data) return <NotFoundState />;

  return (
    <div className="space-y-5 animate-fade-in">
      <InvestigationView key={data.id} data={data} aiRuns={aiRuns} onReload={load} />
    </div>
  );
}

function InvestigationView({
  data,
  aiRuns,
  onReload,
}: {
  data: IncidentDetail;
  aiRuns: AIAnalysisRun[];
  onReload: () => void;
}) {
  const [editingSummary, setEditingSummary] = useState(false);

  return (
    <>
      {/* Breadcrumb */}
      <Link to="/investigations" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-base">
        <ArrowLeft className="h-4 w-4" />
        All investigations
      </Link>

      {/* A. Incident Summary */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">{data.title}</h1>
                {data.is_demo && <Badge variant="demo">Demonstration data</Badge>}
              </div>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">{data.description}</p>
              <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5" />
                  {data.affected_service}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateTime(data.start_time)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Created {formatRelativeTime(data.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {formatRelativeTime(data.updated_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setEditingSummary(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Badge variant={severityBadgeVariant(data.severity)}>{data.severity}</Badge>
            <Badge variant={statusBadgeVariant(data.status)}>{data.status}</Badge>
            <Badge variant="outline">{data.environment}</Badge>
          </div>
        </CardBody>
      </Card>

      {/* E. Investigation Status changer */}
      <StatusChanger incident={data} onReload={onReload} />

      {/* AI Integration */}
      <AIIntegrationPanel
        incidentId={data.id}
        runs={aiRuns}
        evidence={data.evidence}
        onRunComplete={onReload}
      />

      {/* B. Evidence Ledger */}
      <Card>
        <CardHeader
          title="Evidence Ledger"
          subtitle={`${data.evidence.length} ${data.evidence.length === 1 ? 'item' : 'items'} recorded`}
        />
        <CardBody>
          <EvidenceLedger incidentId={data.id} evidence={data.evidence} onUpdated={onReload} />
        </CardBody>
      </Card>

      {/* Research Evidence — Tavily web search */}
      <ResearchPanel
        incidentId={data.id}
        incidentTitle={data.title}
        affectedService={data.affected_service}
        onEvidenceAdded={onReload}
      />

      {/* C. Findings */}
      <Card>
        <CardHeader
          title="Findings"
          subtitle="Classified as observed, inferred, or unknown"
        />
        <CardBody>
          <FindingsPanel findings={data.findings} evidence={data.evidence} />
        </CardBody>
      </Card>

      {/* D. Action Plan */}
      <Card>
        <CardHeader
          title="Action Plan"
          subtitle="Tasks with verification steps. Click the status icon to cycle through states."
        />
        <CardBody>
          <ActionPlan tasks={data.tasks} onUpdated={onReload} />
        </CardBody>
      </Card>

      {editingSummary && (
        <EditSummaryModal
          data={data}
          onClose={() => setEditingSummary(false)}
          onSuccess={() => {
            setEditingSummary(false);
            onReload();
          }}
        />
      )}
    </>
  );
}

function StatusChanger({
  incident,
  onReload,
}: {
  incident: IncidentDetail;
  onReload: () => void;
}) {
  const [changing, setChanging] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    if (newStatus === incident.status) return;
    setChanging(newStatus);
    try {
      await api.updateIncidentStatus(incident.id, newStatus);
      onReload();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setChanging(null);
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Investigation Status</h3>
            <p className="mt-0.5 text-xs text-slate-500">Change the workflow status of this incident</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {INCIDENT_STATUSES.map((status) => {
              const active = incident.status === status;
              const isLoading = changing === status;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isLoading || changing !== null}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-base cursor-pointer disabled:opacity-50 ${
                    active
                      ? 'bg-accent-500/10 text-accent-400 border border-accent-500/30'
                      : 'bg-base-800 text-slate-400 border border-slate-700/40 hover:text-slate-200 hover:border-slate-600/40'
                  }`}
                >
                  {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {status}
                </button>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

const fieldClass =
  'w-full rounded-lg bg-base-800 border border-slate-700/50 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 transition-base focus:border-accent-500/50';
const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';

function EditSummaryModal({
  data,
  onClose,
  onSuccess,
}: {
  data: IncidentDetail;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: data.title,
    description: data.description,
    affected_service: data.affected_service,
    severity: data.severity as Severity,
    environment: data.environment as Environment,
    start_time: toDatetimeLocal(data.start_time),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.affected_service.trim()) {
      setError('Title, description, and affected service are required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateIncident(data.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        affected_service: form.affected_service.trim(),
        severity: form.severity,
        environment: form.environment,
        start_time: form.start_time || null,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update investigation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Edit incident summary">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="edit-title">Title</label>
          <input
            id="edit-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={fieldClass}
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-desc">Description</label>
          <textarea
            id="edit-desc"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className={`${fieldClass} min-h-[80px] resize-y`}
            disabled={saving}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-service">Affected service</label>
          <input
            id="edit-service"
            type="text"
            value={form.affected_service}
            onChange={(e) => setForm((p) => ({ ...p, affected_service: e.target.value }))}
            className={fieldClass}
            disabled={saving}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass} htmlFor="edit-sev">Severity</label>
            <select
              id="edit-sev"
              value={form.severity}
              onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value as Severity }))}
              className={fieldClass}
              disabled={saving}
            >
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-env">Environment</label>
            <select
              id="edit-env"
              value={form.environment}
              onChange={(e) => setForm((p) => ({ ...p, environment: e.target.value as Environment }))}
              className={fieldClass}
              disabled={saving}
            >
              {ENVIRONMENTS.map((env) => <option key={env} value={env}>{env}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-time">Start time</label>
            <input
              id="edit-time"
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
              className={fieldClass}
              disabled={saving}
            />
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-xs text-danger-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-800 border border-slate-700/40">
        <AlertCircle className="h-7 w-7 text-slate-500" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-200">Investigation not found</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          This investigation may have been deleted, or the link may be incorrect.
        </p>
      </div>
      <Link to="/investigations">
        <Button variant="secondary" size="md">
          Back to investigations
        </Button>
      </Link>
    </div>
  );
}
