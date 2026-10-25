import { useState } from 'react';
import {
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  Plus,
  CheckCircle2,
  Globe,
  Clock,
  Zap,
  Calendar,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { ResearchResult, ResearchResponse } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ResearchPanelProps {
  incidentId: string;
  incidentTitle: string;
  affectedService: string;
  onEvidenceAdded: () => void;
}

export function ResearchPanel({
  incidentId,
  incidentTitle,
  affectedService,
  onEvidenceAdded,
}: ResearchPanelProps) {
  const [question, setQuestion] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<ResearchResult[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [usageCredits, setUsageCredits] = useState<number | null>(null);
  const [configMissing, setConfigMissing] = useState(false);

  const defaultQuestion = `${affectedService} ${incidentTitle} troubleshooting known causes`;

  const handleSearch = async () => {
    setSearching(true);
    setSearchError(null);
    setConfigMissing(false);
    try {
      const q = question.trim() || defaultQuestion;
      const response: ResearchResponse = await api.runResearch(incidentId, q);
      setResults(response.results);
      setSearchQuery(response.query);
      setElapsedMs(response.elapsed_ms);
      setUsageCredits(response.usage_credits);
    } catch (err) {
      const e = err as Error & { configuration_missing?: boolean };
      setSearchError(e.message || 'Failed to search');
      setConfigMissing(!!e.configuration_missing);
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/40 bg-gradient-to-br from-base-850/80 to-base-900/40 p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-electric-500/5 border border-electric-500/20">
          <Search className="h-5 w-5 text-electric-400/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-200">Research Evidence</h3>
            <span className="flex items-center gap-1 rounded-md bg-electric-500/10 border border-electric-500/20 px-2 py-0.5 text-[10px] font-medium text-electric-400">
              <Globe className="h-2.5 w-2.5" />
              Tavily Web Search
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            Search the web for relevant sources. Results are unverified — add them to your evidence ledger for review.
          </p>
        </div>
      </div>

      {/* Search input */}
      <div className="mt-4 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !searching) handleSearch();
            }}
            placeholder={defaultQuestion}
            disabled={searching}
            className="flex-1 rounded-lg bg-base-800 border border-slate-700/50 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 transition-base focus:border-electric-500/50 disabled:opacity-50"
          />
          <Button
            variant="primary"
            size="md"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </div>
        <p className="text-[11px] text-slate-600">
          Leave blank to use a query built from the incident title and affected service.
        </p>
      </div>

      {/* Error state */}
      {searchError && (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-danger-500/30 bg-danger-500/5 px-3.5 py-2.5 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-danger-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-danger-400 font-medium">Search failed</p>
            <p className="text-[11px] text-danger-400/70 mt-0.5 break-words">{searchError}</p>
            {configMissing && (
              <p className="text-[11px] text-slate-500 mt-1">
                The TAVILY_API_KEY secret needs to be added to the Supabase project to enable web research.
              </p>
            )}
            <button
              onClick={handleSearch}
              disabled={searching}
              className="mt-1.5 flex items-center gap-1 text-[11px] text-electric-400 hover:text-electric-300 transition-base cursor-pointer disabled:opacity-50"
            >
              <Search className="h-3 w-3" />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Search metadata */}
      {results && !searchError && (
        <div className="mt-3 flex items-center gap-3 flex-wrap text-[11px] text-slate-600">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {elapsedMs != null ? `${elapsedMs}ms` : '—'}
          </span>
          {usageCredits != null && (
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {usageCredits} credit{usageCredits === 1 ? '' : 's'}
            </span>
          )}
          <span className="text-slate-700 truncate max-w-xs" title={searchQuery}>
            Query: {searchQuery}
          </span>
        </div>
      )}

      {/* Results */}
      {results && !searchError && (
        <div className="mt-3 space-y-2.5 animate-fade-in">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-base-800 border border-slate-700/40">
                <Search className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-300">No results found</h4>
                <p className="mt-0.5 text-xs text-slate-500 max-w-sm">
                  Try rephrasing your search question or use more specific terms.
                </p>
              </div>
            </div>
          ) : (
            results.map((result) => (
              <ResearchResultRow
                key={result.url}
                result={result}
                incidentId={incidentId}
                onAdded={onEvidenceAdded}
              />
            ))
          )}
        </div>
      )}

      {/* Initial state */}
      {!results && !searchError && !searching && (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs text-slate-500">
            Search the web for documentation, known issues, and troubleshooting guides related to this incident.
          </p>
          <div className="space-y-1">
            {[
              'Real web-search results from the Tavily Search API',
              'Add useful sources directly to your evidence ledger',
              'All search results are marked as unverified until independently confirmed',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-[11px] text-slate-600">
                <Globe className="h-3 w-3 text-slate-700" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResearchResultRow({
  result,
  incidentId,
  onAdded,
}: {
  result: ResearchResult;
  incidentId: string;
  onAdded: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setAdding(true);
    setError(null);
    try {
      await api.addWebSearchEvidence(incidentId, {
        title: result.title,
        url: result.url,
        content: result.content,
      });
      setAdded(true);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add evidence');
    } finally {
      setAdding(false);
    }
  };

  let hostname = result.url;
  try {
    hostname = new URL(result.url).hostname;
  } catch {
    // keep raw URL
  }

  return (
    <div className="rounded-lg border border-slate-700/40 bg-base-800/40 p-3.5 transition-base hover:border-slate-600/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Title + URL */}
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-200 hover:text-electric-400 transition-base"
          >
            {result.title}
          </a>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-600">
            <Globe className="h-3 w-3" />
            {hostname}
            <ExternalLink className="h-3 w-3" />
          </div>

          {/* Excerpt */}
          {result.content && (
            <p className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-3">
              {result.content}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {result.score != null && (
              <Badge variant="outline">
                Relevance: {(result.score * 100).toFixed(0)}%
              </Badge>
            )}
            {result.published_date && (
              <span className="flex items-center gap-1 text-[11px] text-slate-600">
                <Calendar className="h-3 w-3" />
                {formatDate(result.published_date)}
              </span>
            )}
            <Badge variant="outline">
              <Lock className="h-3 w-3" />
              Unverified
            </Badge>
          </div>

          {error && (
            <p className="mt-2 text-[11px] text-danger-400">{error}</p>
          )}
        </div>

        {/* Add button */}
        <div className="shrink-0">
          {added ? (
            <span className="flex items-center gap-1.5 text-xs text-success-400">
              <CheckCircle2 className="h-4 w-4" />
              Added
            </span>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAdd}
              disabled={adding}
            >
              {adding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              {adding ? 'Adding…' : 'Add'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}
