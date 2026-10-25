export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type IncidentStatus = 'Draft' | 'Investigating' | 'Action Required' | 'Resolved';
export type Environment = 'Production' | 'Staging' | 'Development' | 'Unknown';
export type EvidenceSourceType = 'note' | 'reference_url' | 'web_search';
export type VerificationState = 'user_provided' | 'externally_verified' | 'retrieved_unverified';
export type FindingClassification = 'observed' | 'inferred' | 'unknown';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Open' | 'In Progress' | 'Complete';

export interface Incident {
  id: string;
  title: string;
  description: string;
  affected_service: string;
  environment: Environment;
  severity: Severity;
  status: IncidentStatus;
  start_time: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvidenceItem {
  id: string;
  incident_id: string;
  source_type: EvidenceSourceType;
  title: string;
  content: string | null;
  source_url: string | null;
  verification_state: VerificationState;
  is_demo: boolean;
  created_at: string;
}

export interface Finding {
  id: string;
  incident_id: string;
  title: string;
  description: string;
  classification: FindingClassification;
  confidence_explanation: string | null;
  evidence_ids: string[];
  is_demo: boolean;
  is_ai: boolean;
  created_at: string;
}

export interface ActionTask {
  id: string;
  incident_id: string;
  title: string;
  rationale: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  verification_steps: string | null;
  is_demo: boolean;
  is_ai: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncidentDetail extends Incident {
  evidence: EvidenceItem[];
  findings: Finding[];
  tasks: ActionTask[];
}

export const SEVERITIES: Severity[] = ['Low', 'Medium', 'High', 'Critical'];
export const INCIDENT_STATUSES: IncidentStatus[] = ['Draft', 'Investigating', 'Action Required', 'Resolved'];
export const ENVIRONMENTS: Environment[] = ['Production', 'Staging', 'Development', 'Unknown'];
export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
export const TASK_STATUSES: TaskStatus[] = ['Open', 'In Progress', 'Complete'];
export const FINDING_CLASSIFICATIONS: FindingClassification[] = ['observed', 'inferred', 'unknown'];

export interface NewIncidentInput {
  title: string;
  description: string;
  affected_service: string;
  severity: Severity;
  environment: Environment;
  start_time: string | null;
  initial_evidence: string;
}

export interface NewEvidenceInput {
  source_type: EvidenceSourceType;
  title: string;
  content: string | null;
  source_url: string | null;
}

export type AIConnectionStatus = 'not_configured' | 'ready' | 'connected' | 'error';

export interface AIAnalysisRun {
  id: string;
  incident_id: string;
  provider: string;
  model: string;
  status: 'success' | 'error';
  summary: string | null;
  result_json: AIResultData | null;
  error_message: string | null;
  elapsed_ms: number | null;
  created_at: string;
}

export interface AIResultData {
  summary: string;
  situation: {
    observed: string[];
    inferred: string[];
    unknown: string[];
  };
  hypotheses: Array<{
    title: string;
    rationale: string;
    confidence: string;
    supporting_evidence_ids: string[];
    missing_evidence: string[];
  }>;
  findings: Array<{
    title: string;
    description: string;
    classification: FindingClassification;
    confidence: string;
    evidence_ids: string[];
  }>;
  actions: Array<{
    title: string;
    rationale: string;
    priority: string;
    verification_steps: string[];
  }>;
  questions_to_resolve: string[];
}

export interface AIInvestigateResponse {
  success: boolean;
  run_id: string;
  provider: string;
  model: string;
  elapsed_ms: number;
  summary: string;
  result: AIResultData;
  created_at: string;
}

export interface ResearchResult {
  title: string;
  url: string;
  content: string;
  score: number | null;
  published_date: string | null;
  position: number;
}

export interface ResearchResponse {
  query: string;
  results: ResearchResult[];
  elapsed_ms: number;
  usage_credits: number | null;
}
