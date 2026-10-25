import { useState } from 'react';
import { Link2, FileText, CheckCircle2, User, ExternalLink, Clock, Globe, Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { EvidenceItem, NewEvidenceInput } from '@/lib/types';
import { formatRelativeTime } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingState } from '@/components/ui/States';

interface EvidenceLedgerProps {
  incidentId: string;
  evidence: EvidenceItem[];
  onUpdated: () => void;
}

export function EvidenceLedger({ incidentId, evidence, onUpdated }: EvidenceLedgerProps) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Button size="sm" variant="secondary" onClick={() => setShowNoteModal(true)}>
          <FileText className="h-3.5 w-3.5" />
          Add note
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setShowUrlModal(true)}>
          <Link2 className="h-3.5 w-3.5" />
          Add reference URL
        </Button>
      </div>

      {evidence.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6 text-slate-600" />}
          title="No evidence recorded"
          message="Add notes or reference URLs to build the evidence ledger for this incident."
        />
      ) : (
        <div className="space-y-2">
          {evidence.map((item) => (
            <EvidenceRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {showNoteModal && (
        <AddNoteModal
          incidentId={incidentId}
          onClose={() => setShowNoteModal(false)}
          onSuccess={() => {
            setShowNoteModal(false);
            onUpdated();
          }}
        />
      )}
      {showUrlModal && (
        <AddUrlModal
          incidentId={incidentId}
          onClose={() => setShowUrlModal(false)}
          onSuccess={() => {
            setShowUrlModal(false);
            onUpdated();
          }}
        />
      )}
    </div>
  );
}

function EvidenceRow({ item }: { item: EvidenceItem }) {
  const isUrl = item.source_type === 'reference_url';
  const isWebSearch = item.source_type === 'web_search';
  const verified = item.verification_state === 'externally_verified';
  const retrievedUnverified = item.verification_state === 'retrieved_unverified';

  return (
    <div className="rounded-lg border border-slate-700/40 bg-base-800/40 p-3.5 transition-base hover:border-slate-600/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              {isUrl ? (
                <Link2 className="h-3.5 w-3.5 text-electric-400" />
              ) : isWebSearch ? (
                <Globe className="h-3.5 w-3.5 text-electric-400" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-slate-500" />
              )}
              {item.title}
            </span>
            {item.is_demo && <Badge variant="demo">Demo</Badge>}
            {verified ? (
              <Badge variant="severity-low">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            ) : retrievedUnverified ? (
              <Badge variant="outline">
                <Search className="h-3 w-3" />
                Retrieved — unverified
              </Badge>
            ) : (
              <Badge variant="outline">
                <User className="h-3 w-3" />
                User-provided
              </Badge>
            )}
          </div>
          {item.content && (
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{item.content}</p>
          )}
          {(isUrl || isWebSearch) && item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-electric-400 hover:text-electric-300 transition-base"
            >
              {item.source_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-600">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(item.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

const fieldClass =
  'w-full rounded-lg bg-base-800 border border-slate-700/50 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 transition-base focus:border-accent-500/50';
const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';
const errorTextClass = 'mt-1 text-xs text-danger-400';

function AddNoteModal({
  incidentId,
  onClose,
  onSuccess,
}: {
  incidentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('A title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: NewEvidenceInput = {
        source_type: 'note',
        title: title.trim(),
        content: content.trim() || null,
        source_url: null,
      };
      await api.addEvidence(incidentId, input);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add evidence');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Add evidence note">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="note-title">Title <span className="text-danger-400">*</span></label>
          <input
            id="note-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={fieldClass}
            placeholder="e.g. Error logs from auth service"
            disabled={saving}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="note-content">Details</label>
          <textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${fieldClass} min-h-[80px] resize-y`}
            placeholder="Describe the evidence, observation, or context."
            disabled={saving}
          />
        </div>
        {error && <p className={errorTextClass}>{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? 'Saving…' : 'Add note'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AddUrlModal({
  incidentId,
  onClose,
  onSuccess,
}: {
  incidentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validateUrl = (value: string): string | null => {
    if (!value.trim()) return 'URL is required';
    try {
      const parsed = new URL(value.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return 'URL must start with http:// or https://';
      }
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('A title is required');
      return;
    }
    const urlError = validateUrl(url);
    if (urlError) {
      setError(urlError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: NewEvidenceInput = {
        source_type: 'reference_url',
        title: title.trim(),
        content: null,
        source_url: url.trim(),
      };
      await api.addEvidence(incidentId, input);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reference');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Add reference URL">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="url-title">Title <span className="text-danger-400">*</span></label>
          <input
            id="url-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={fieldClass}
            placeholder="e.g. Deployment changelog"
            disabled={saving}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="url-value">URL <span className="text-danger-400">*</span></label>
          <input
            id="url-value"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={fieldClass}
            placeholder="https://example.com/changelog"
            disabled={saving}
          />
        </div>
        {error && <p className={errorTextClass}>{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? 'Saving…' : 'Add reference'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function EvidenceLoadingState() {
  return <LoadingState message="Loading evidence…" />;
}
