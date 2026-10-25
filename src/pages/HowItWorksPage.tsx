import { FileSearch, Link2, Lightbulb, ClipboardCheck, BrainCircuit, ArrowRight, Plus, Search } from 'lucide-react';
import { Link } from '@/lib/router';
import { Button } from '@/components/ui/Button';

export function HowItWorksPage() {
  const steps = [
    {
      icon: FileSearch,
      title: 'Report an incident',
      description: 'Start with what you know: a title, description, affected service, severity, and any initial context. TracePilot creates a structured investigation record.',
    },
    {
      icon: Link2,
      title: 'Build the evidence ledger',
      description: 'Add notes and reference URLs as evidence accumulates. Each item is timestamped and tagged as user-provided, retrieved from web search, or externally verified, so you always know the provenance of your data.',
    },
    {
      icon: Search,
      title: 'Research evidence with Tavily',
      description: 'Search the web for relevant documentation, known issues, and troubleshooting guides. Results are retrieved through the Tavily Search API and marked as unverified until independently confirmed. Add useful sources directly to your evidence ledger.',
    },
    {
      icon: Lightbulb,
      title: 'Classify findings',
      description: 'Distinguish what you have directly observed from what you have inferred and what remains unknown. This separation prevents assumptions from being treated as established facts.',
    },
    {
      icon: ClipboardCheck,
      title: 'Track the action plan',
      description: 'Work through verification steps for each task. Mark items as Open, In Progress, or Complete. Every action should have a verification test before it is closed.',
    },
    {
      icon: BrainCircuit,
      title: 'AI investigation',
      description: 'Live AI analysis through NVIDIA Nemotron via Nebius Token Factory generates evidence-grounded findings, hypotheses, and prioritized actions. Run it from any investigation workspace — it uses all evidence in the ledger, including sources you added from web research.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">How TracePilot works</h1>
        <p className="mt-2 text-sm text-slate-400 max-w-2xl">
          TracePilot turns an incident report into an organised investigation. It helps your team
          separate observed facts from assumptions and guides you toward verifiable actions.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-4 rounded-xl border border-slate-700/40 bg-base-850/60 p-5 transition-base hover:border-slate-600/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-500/5 border border-accent-500/20">
                <Icon className="h-5 w-5 text-accent-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-600">0{idx + 1}</span>
                  <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
                </div>
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key principles */}
      <div className="rounded-xl border border-slate-700/40 bg-base-900/40 p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Key principles</h3>
        <div className="space-y-2">
          {[
            'Observed facts are separated from inferred conclusions and acknowledged unknowns.',
            'Every evidence item has a source type and verification state.',
            'Action items require verification steps before an incident can be closed.',
            'No potentially destructive production action is presented as automatically approved.',
            'Demo content is always clearly labelled and never represented as live AI output.',
            'Web search results are unverified supporting material, not proof that a claim is true.',
            'AI analysis and web research are separate services — each requires its own credentials.',
          ].map((principle) => (
            <div key={principle} className="flex items-start gap-2 text-sm text-slate-400">
              <ArrowRight className="h-4 w-4 text-accent-500/60 mt-0.5 shrink-0" />
              {principle}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-accent-500/20 bg-accent-500/5 p-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Ready to start an investigation?</h3>
          <p className="mt-0.5 text-xs text-slate-500">Create a new investigation in under a minute.</p>
        </div>
        <Link to="/incidents/new">
          <Button variant="primary" size="md">
            <Plus className="h-4 w-4" />
            New Investigation
          </Button>
        </Link>
      </div>
    </div>
  );
}
