import { useState } from 'react';
import {
  BrainCircuit,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Lightbulb,
  HelpCircle,
  Eye,
  Link2,
  Clock,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import type {
  AIAnalysisRun,
  AIResultData,
  AIConnectionStatus,
  EvidenceItem,
} from '@/lib/types';
import { formatRelativeTime } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AIIntegrationPanelProps {
  incidentId: string;
  runs: AIAnalysisRun[];
  evidence: EvidenceItem[];
  onRunComplete: () => void;
}

export function AIIntegrationPanel({
  incidentId,
  runs,
  evidence,
  onRunComplete,
}: AIIntegrationPanelProps) {
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const latestSuccess = runs.find((r) => r.status === 'success');
  const latestError = runs.find((r) => r.status === 'error');
  const hasSuccess = !!latestSuccess;

  let connectionStatus: AIConnectionStatus;
  if (runError || (latestError && !hasSuccess)) {
    connectionStatus = 'error';
  } else if (hasSuccess) {
    connectionStatus = 'connected';
  } else {
    connectionStatus = 'ready';
  }

  const handleRun = async () => {
    setRunning(true);
    setRunError(null);
    try {
      await api.runAIInvestigation(incidentId);
      onRunComplete();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to run AI investigation';
      setRunError(message);
    } finally {
      setRunning(false);
    }
  };

  const result = latestSuccess?.result_json ?? null;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-gradient-to-br from-base-850/80 to-base-900/40 p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-500/5 border border-accent-500/20">
          <BrainCircuit className="h-5 w-5 text-accent-400/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-200">AI Investigation</h3>
            <ConnectionBadge status={connectionStatus} />
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            Provider: Nebius Token Factory · Model: {latestSuccess?.model ?? 'nvidia/Nemotron-3_5-Lightning'}
            {latestSuccess?.elapsed_ms != null && ` · ${latestSuccess.elapsed_ms}ms`}
          </p>
        </div>
      </div>

      {/* Action button */}
      <div className="mt-4 flex items-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={handleRun}
          disabled={running}
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run AI Investigation
            </>
          )}
        </Button>
        {hasSuccess && latestSuccess && (
          <span className="text-[11px] text-slate-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last run {formatRelativeTime(latestSuccess.created_at)}
          </span>
        )}
      </div>

      {/* Error state */}
      {(runError || (latestError && !hasSuccess && !running)) && (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-danger-500/30 bg-danger-500/5 px-3.5 py-2.5 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-danger-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-danger-400 font-medium">AI investigation failed</p>
            <p className="text-[11px] text-danger-400/70 mt-0.5 break-words">
              {runError || latestError?.error_message}
            </p>
            {runError && runError.includes('not configured') && (
              <p className="text-[11px] text-slate-500 mt-1">
                The NEBIUS_API_KEY secret needs to be added to the Supabase project to enable live AI analysis.
              </p>
            )}
            <button
              onClick={handleRun}
              disabled={running}
              className="mt-1.5 flex items-center gap-1 text-[11px] text-accent-400 hover:text-accent-300 transition-base cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && <AnalysisResult result={result} evidence={evidence} />}

      {/* No results yet */}
      {!result && !runError && !running && !latestError && (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs text-slate-500">
            Run an AI investigation to generate evidence-grounded findings, hypotheses, and prioritized actions.
          </p>
          <div className="space-y-1">
            {[
              'AI-powered finding classification (Observed / Inferred / Unknown)',
              'Evidence-grounded hypotheses with confidence levels',
              'Prioritized, non-destructive action recommendations',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-[11px] text-slate-600">
                <Zap className="h-3 w-3 text-slate-700" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionBadge({ status }: { status: AIConnectionStatus }) {
  switch (status) {
    case 'connected':
      return (
        <span className="flex items-center gap-1 rounded-md bg-success-500/10 border border-success-500/20 px-2 py-0.5 text-[10px] font-medium text-success-400">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Connected
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1 rounded-md bg-danger-500/10 border border-danger-500/20 px-2 py-0.5 text-[10px] font-medium text-danger-400">
          <AlertCircle className="h-2.5 w-2.5" />
          Error
        </span>
      );
    case 'ready':
      return (
        <span className="flex items-center gap-1 rounded-md bg-electric-500/10 border border-electric-500/20 px-2 py-0.5 text-[10px] font-medium text-electric-400">
          <Zap className="h-2.5 w-2.5" />
          Ready to test
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 rounded-md bg-slate-700/40 border border-slate-600/30 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          <Lock className="h-2.5 w-2.5" />
          Not configured
        </span>
      );
  }
}

function AnalysisResult({ result, evidence }: { result: AIResultData; evidence: EvidenceItem[] }) {
  const [expandedHypotheses, setExpandedHypotheses] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState(false);
  const evidenceMap = new Map(evidence.map((e) => [e.id, e]));

  return (
    <div className="mt-4 space-y-4 animate-fade-in">
      {/* Summary */}
      <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-400/70 mb-1">
          AI Assessment
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
      </div>

      {/* Situation */}
      {(result.situation.observed.length > 0 ||
        result.situation.inferred.length > 0 ||
        result.situation.unknown.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Situation</h4>
          <SituationGroup
            icon={<Eye className="h-3 w-3 text-electric-400" />}
            label="Observed"
            items={result.situation.observed}
            color="text-electric-400"
          />
          <SituationGroup
            icon={<Lightbulb className="h-3 w-3 text-warning-400" />}
            label="Inferred"
            items={result.situation.inferred}
            color="text-warning-400"
          />
          <SituationGroup
            icon={<HelpCircle className="h-3 w-3 text-slate-400" />}
            label="Unknown"
            items={result.situation.unknown}
            color="text-slate-400"
          />
        </div>
      )}

      {/* Hypotheses */}
      {result.hypotheses.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedHypotheses((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-300 transition-base"
          >
            <Lightbulb className="h-3.5 w-3.5 text-warning-400" />
            Hypotheses ({result.hypotheses.length})
            <span className="text-slate-700">{expandedHypotheses ? '−' : '+'}</span>
          </button>
          {expandedHypotheses && (
            <div className="mt-2 space-y-2 animate-fade-in">
              {result.hypotheses.map((h, idx) => (
                <div key={idx} className="rounded-lg border border-slate-700/40 bg-base-800/40 p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="text-sm font-medium text-slate-200">{h.title}</h5>
                    <Badge variant={confidenceVariant(h.confidence)}>{h.confidence} confidence</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{h.rationale}</p>
                  {h.supporting_evidence_ids.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <Link2 className="h-3 w-3 text-slate-600" />
                      {h.supporting_evidence_ids.map((eid) => {
                        const ev = evidenceMap.get(eid);
                        return (
                          <span key={eid} className="text-[11px] text-slate-500">
                            {ev?.title ?? eid}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {h.missing_evidence.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
                        Missing evidence
                      </p>
                      <ul className="space-y-0.5">
                        {h.missing_evidence.map((m, mi) => (
                          <li key={mi} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Questions to resolve */}
      {result.questions_to_resolve.length > 0 && (
        <div>
          <button
            onClick={() => setExpandedQuestions((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide cursor-pointer hover:text-slate-300 transition-base"
          >
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            Questions to resolve ({result.questions_to_resolve.length})
            <span className="text-slate-700">{expandedQuestions ? '−' : '+'}</span>
          </button>
          {expandedQuestions && (
            <ul className="mt-2 space-y-1.5 animate-fade-in">
              {result.questions_to_resolve.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="h-1 w-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                  {q}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SituationGroup({
  icon,
  label,
  items,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="ml-1">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className={`text-[11px] font-semibold ${color}`}>{label}</span>
      </div>
      <ul className="ml-5 space-y-0.5">
        {items.map((item, idx) => (
          <li key={idx} className="text-xs text-slate-500 flex items-start gap-1.5">
            <span className="h-1 w-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function confidenceVariant(confidence: string): 'severity-low' | 'severity-medium' | 'severity-high' | 'default' {
  const map: Record<string, 'severity-low' | 'severity-medium' | 'severity-high'> = {
    high: 'severity-high',
    medium: 'severity-medium',
    low: 'severity-low',
  };
  return map[confidence] ?? 'default';
}
