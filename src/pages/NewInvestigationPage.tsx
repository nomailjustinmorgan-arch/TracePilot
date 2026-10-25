import { useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { api } from '@/lib/api';
import {
  type Severity,
  type Environment,
  SEVERITIES,
  ENVIRONMENTS,
  type NewIncidentInput,
} from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface FormState {
  title: string;
  description: string;
  affected_service: string;
  severity: Severity;
  environment: Environment;
  start_time: string;
  initial_evidence: string;
}

const initialState: FormState = {
  title: '',
  description: '',
  affected_service: '',
  severity: 'Medium',
  environment: 'Production',
  start_time: '',
  initial_evidence: '',
};

const fieldClass =
  'w-full rounded-lg bg-base-800 border border-slate-700/50 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 transition-base focus:border-accent-500/50 focus:bg-base-800/80';
const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';
const errorClass = 'mt-1.5 text-xs text-danger-400 flex items-center gap-1';
const inputErrorClass = 'border-danger-500/50';

export function NewInvestigationPage() {
  const { navigate } = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Incident title is required';
    if (!form.description.trim()) newErrors.description = 'Incident description is required';
    if (!form.affected_service.trim()) newErrors.affected_service = 'Affected service is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const input: NewIncidentInput = {
        title: form.title.trim(),
        description: form.description.trim(),
        affected_service: form.affected_service.trim(),
        severity: form.severity,
        environment: form.environment,
        start_time: form.start_time || null,
        initial_evidence: form.initial_evidence,
      };
      const incident = await api.createIncident(input);
      navigate(`/incidents/${incident.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? `Failed to create investigation: ${err.message}`
          : 'Failed to create investigation. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-base">
        <ArrowLeft className="h-4 w-4" />
        Back to overview
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">New Investigation</h1>
        <p className="mt-1 text-sm text-slate-400">
          Start an incident investigation by providing the initial details. You can add evidence,
          findings, and actions once the investigation is created.
        </p>
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-danger-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-danger-400 font-medium">Could not save investigation</p>
            <p className="text-xs text-danger-400/70 mt-0.5">{submitError}</p>
            <p className="text-xs text-slate-500 mt-1">Your entered data has been preserved in the form below.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Title */}
        <div>
          <label htmlFor="title" className={labelClass}>
            Incident title <span className="text-danger-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className={`${fieldClass} ${errors.title ? inputErrorClass : ''}`}
            placeholder="e.g. Database connection timeouts in production"
            disabled={submitting}
            aria-required="true"
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className={errorClass}>
              <AlertCircle className="h-3 w-3" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className={labelClass}>
            Incident description <span className="text-danger-400">*</span>
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className={`${fieldClass} ${errors.description ? inputErrorClass : ''} min-h-[100px] resize-y`}
            placeholder="Describe what is happening, when it started, and what impact you've observed."
            disabled={submitting}
            aria-required="true"
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className={errorClass}>
              <AlertCircle className="h-3 w-3" />
              {errors.description}
            </p>
          )}
        </div>

        {/* Affected service */}
        <div>
          <label htmlFor="affected_service" className={labelClass}>
            Affected service or component <span className="text-danger-400">*</span>
          </label>
          <input
            id="affected_service"
            type="text"
            value={form.affected_service}
            onChange={(e) => update('affected_service', e.target.value)}
            className={`${fieldClass} ${errors.affected_service ? inputErrorClass : ''}`}
            placeholder="e.g. Authentication Service, Payment API, Web Frontend"
            disabled={submitting}
            aria-required="true"
            aria-invalid={!!errors.affected_service}
          />
          {errors.affected_service && (
            <p className={errorClass}>
              <AlertCircle className="h-3 w-3" />
              {errors.affected_service}
            </p>
          )}
        </div>

        {/* Severity + Environment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="severity" className={labelClass}>
              Severity <span className="text-danger-400">*</span>
            </label>
            <select
              id="severity"
              value={form.severity}
              onChange={(e) => update('severity', e.target.value)}
              className={fieldClass}
              disabled={submitting}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="environment" className={labelClass}>
              Environment
            </label>
            <select
              id="environment"
              value={form.environment}
              onChange={(e) => update('environment', e.target.value)}
              className={fieldClass}
              disabled={submitting}
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start time */}
        <div>
          <label htmlFor="start_time" className={labelClass}>
            Incident start time <span className="text-slate-600 font-normal">(optional)</span>
          </label>
          <input
            id="start_time"
            type="datetime-local"
            value={form.start_time}
            onChange={(e) => update('start_time', e.target.value)}
            className={fieldClass}
            disabled={submitting}
          />
        </div>

        {/* Initial evidence */}
        <div>
          <label htmlFor="initial_evidence" className={labelClass}>
            Initial evidence or context <span className="text-slate-600 font-normal">(optional)</span>
          </label>
          <textarea
            id="initial_evidence"
            value={form.initial_evidence}
            onChange={(e) => update('initial_evidence', e.target.value)}
            className={`${fieldClass} min-h-[80px] resize-y`}
            placeholder="Any initial context, user reports, or observations to start the evidence ledger."
            disabled={submitting}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/">
            <Button variant="ghost" size="md" disabled={submitting}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create investigation'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
