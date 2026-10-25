import { useState } from 'react';
import { Eye, Lightbulb, HelpCircle, Link2 } from 'lucide-react';
import type { Finding, EvidenceItem } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';

interface FindingsPanelProps {
  findings: Finding[];
  evidence: EvidenceItem[];
}

const classificationConfig = {
  observed: {
    icon: Eye,
    label: 'Observed',
    color: 'text-electric-400',
    bg: 'bg-electric-500/10',
    border: 'border-electric-500/20',
  },
  inferred: {
    icon: Lightbulb,
    label: 'Inferred',
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/20',
  },
  unknown: {
    icon: HelpCircle,
    label: 'Unknown',
    color: 'text-slate-400',
    bg: 'bg-slate-600/10',
    border: 'border-slate-600/30',
  },
} as const;

export function FindingsPanel({ findings, evidence }: FindingsPanelProps) {
  if (findings.length === 0) {
    return (
      <EmptyState
        icon={<Lightbulb className="h-6 w-6 text-slate-600" />}
        title="No findings yet"
        message="Findings classify what is known, what is inferred, and what remains unknown. Run an AI investigation to generate evidence-grounded findings."
      />
    );
  }

  const evidenceMap = new Map(evidence.map((e) => [e.id, e]));

  const grouped = {
    observed: findings.filter((f) => f.classification === 'observed'),
    inferred: findings.filter((f) => f.classification === 'inferred'),
    unknown: findings.filter((f) => f.classification === 'unknown'),
  };

  return (
    <div className="space-y-4">
      {(['observed', 'inferred', 'unknown'] as const).map((cls) => {
        const items = grouped[cls];
        if (items.length === 0) return null;
        const config = classificationConfig[cls];
        const Icon = config.icon;
        return (
          <div key={cls}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`flex h-5 w-5 items-center justify-center rounded ${config.bg} border ${config.border}`}>
                <Icon className={`h-3 w-3 ${config.color}`} />
              </span>
              <h4 className={`text-xs font-semibold uppercase tracking-wide ${config.color}`}>
                {config.label}
              </h4>
              <span className="text-xs text-slate-600">({items.length})</span>
            </div>
            <div className="space-y-2 ml-7">
              {items.map((finding) => (
                <FindingRow key={finding.id} finding={finding} evidenceMap={evidenceMap} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FindingRow({
  finding,
  evidenceMap,
}: {
  finding: Finding;
  evidenceMap: Map<string, EvidenceItem>;
}) {
  const [expanded, setExpanded] = useState(false);
  const supportedEvidence = finding.evidence_ids
    .map((id) => evidenceMap.get(id))
    .filter((e): e is EvidenceItem => !!e);

  return (
    <div className="rounded-lg border border-slate-700/40 bg-base-800/40 p-3 transition-base hover:border-slate-600/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="text-sm font-medium text-slate-200">{finding.title}</h5>
            {finding.is_demo && <Badge variant="demo">Demo</Badge>}
            {finding.is_ai && <Badge variant="severity-low">AI</Badge>}
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{finding.description}</p>
          {finding.confidence_explanation && (
            <p className="mt-1.5 text-[11px] text-slate-600 italic">
              {finding.confidence_explanation}
            </p>
          )}
        </div>
      </div>
      {supportedEvidence.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-accent-400 transition-base cursor-pointer"
          >
            <Link2 className="h-3 w-3" />
            {supportedEvidence.length} supporting {supportedEvidence.length === 1 ? 'evidence item' : 'evidence items'}
            <span className="text-slate-700">{expanded ? '−' : '+'}</span>
          </button>
          {expanded && (
            <div className="mt-1.5 space-y-1 animate-fade-in">
              {supportedEvidence.map((ev) => (
                <div key={ev.id} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="h-1 w-1 rounded-full bg-accent-500/40" />
                  {ev.title}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

