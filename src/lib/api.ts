import { supabase } from './supabase';
import type {
  Incident,
  EvidenceItem,
  Finding,
  ActionTask,
  IncidentDetail,
  NewIncidentInput,
  NewEvidenceInput,
  Severity,
  IncidentStatus,
  TaskStatus,
  Environment,
  AIAnalysisRun,
  AIInvestigateResponse,
  ResearchResponse,
} from './types';

export async function listIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as Incident[]) ?? [];
}

export async function getIncident(id: string): Promise<Incident | null> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Incident | null;
}

export async function getIncidentDetail(id: string): Promise<IncidentDetail | null> {
  const incident = await getIncident(id);
  if (!incident) return null;

  const [evidenceRes, findingsRes, tasksRes] = await Promise.all([
    supabase.from('evidence').select('*').eq('incident_id', id).order('created_at', { ascending: true }),
    supabase.from('findings').select('*').eq('incident_id', id).order('created_at', { ascending: true }),
    supabase.from('action_tasks').select('*').eq('incident_id', id).order('created_at', { ascending: true }),
  ]);

  if (evidenceRes.error) throw evidenceRes.error;
  if (findingsRes.error) throw findingsRes.error;
  if (tasksRes.error) throw tasksRes.error;

  return {
    ...incident,
    evidence: (evidenceRes.data as EvidenceItem[]) ?? [],
    findings: (findingsRes.data as Finding[]) ?? [],
    tasks: (tasksRes.data as ActionTask[]) ?? [],
  };
}

export async function createIncident(input: NewIncidentInput): Promise<Incident> {
  const { initial_evidence, ...incidentData } = input;

  const insertData: Record<string, unknown> = {
    title: incidentData.title,
    description: incidentData.description,
    affected_service: incidentData.affected_service,
    severity: incidentData.severity,
    environment: incidentData.environment,
    status: 'Investigating',
  };

  if (incidentData.start_time) {
    insertData.start_time = new Date(incidentData.start_time).toISOString();
  }

  const { data, error } = await supabase
    .from('incidents')
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;

  const incident = data as Incident;

  if (initial_evidence.trim()) {
    const { error: evError } = await supabase.from('evidence').insert({
      incident_id: incident.id,
      source_type: 'note',
      title: 'Initial context',
      content: initial_evidence.trim(),
      verification_state: 'user_provided',
    });
    if (evError) throw evError;
  }

  return incident;
}

export async function updateIncident(
  id: string,
  updates: Partial<Pick<Incident, 'title' | 'description' | 'severity' | 'status' | 'environment' | 'affected_service' | 'start_time'>>
): Promise<Incident> {
  const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  if (updates.start_time) {
    updateData.start_time = new Date(updates.start_time).toISOString();
  }
  const { data, error } = await supabase
    .from('incidents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Incident;
}

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  return updateIncident(id, { status });
}

export async function addEvidence(incidentId: string, input: NewEvidenceInput): Promise<EvidenceItem> {
  const { data, error } = await supabase
    .from('evidence')
    .insert({
      incident_id: incidentId,
      source_type: input.source_type,
      title: input.title,
      content: input.content,
      source_url: input.source_url,
      verification_state: 'user_provided',
    })
    .select()
    .single();
  if (error) throw error;
  return data as EvidenceItem;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<ActionTask> {
  const { data, error } = await supabase
    .from('action_tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data as ActionTask;
}

export async function addTask(
  incidentId: string,
  task: { title: string; rationale: string; priority: string; verification_steps: string }
): Promise<ActionTask> {
  const { data, error } = await supabase
    .from('action_tasks')
    .insert({
      incident_id: incidentId,
      title: task.title,
      rationale: task.rationale || null,
      priority: task.priority,
      status: 'Open',
      verification_steps: task.verification_steps || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ActionTask;
}

export async function getAIAnalysisRuns(incidentId: string): Promise<AIAnalysisRun[]> {
  const { data, error } = await supabase
    .from('ai_analysis_runs')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as AIAnalysisRun[]) ?? [];
}

export async function runAIInvestigation(incidentId: string): Promise<AIInvestigateResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const functionUrl = `${supabaseUrl}/functions/v1/tracepilot-investigate`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ incidentId }),
  });

  const body = await response.json();

  if (!response.ok) {
    const message = body?.error || `AI investigation failed (${response.status})`;
    const err = new Error(message) as Error & {
      status?: number;
      configuration_missing?: boolean;
      cooldown_seconds_remaining?: number;
    };
    err.status = response.status;
    err.configuration_missing = body?.configuration_missing;
    err.cooldown_seconds_remaining = body?.cooldown_seconds_remaining;
    throw err;
  }

  return body as AIInvestigateResponse;
}

export async function addWebSearchEvidence(
  incidentId: string,
  result: { title: string; url: string; content: string }
): Promise<EvidenceItem> {
  const { data: existing } = await supabase
    .from('evidence')
    .select('id')
    .eq('incident_id', incidentId)
    .eq('source_url', result.url)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('evidence')
      .select('*')
      .eq('id', existing.id)
      .single();
    if (error) throw error;
    return data as EvidenceItem;
  }

  const { data, error } = await supabase
    .from('evidence')
    .insert({
      incident_id: incidentId,
      source_type: 'web_search',
      title: result.title,
      content: result.content || null,
      source_url: result.url,
      verification_state: 'retrieved_unverified',
    })
    .select()
    .single();
  if (error) throw error;
  return data as EvidenceItem;
}

export async function runResearch(
  incidentId: string,
  question?: string
): Promise<ResearchResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const functionUrl = `${supabaseUrl}/functions/v1/tracepilot-research`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ incidentId, question }),
  });

  const body = await response.json();

  if (!response.ok) {
    const message = body?.error || `Research failed (${response.status})`;
    const err = new Error(message) as Error & {
      status?: number;
      configuration_missing?: boolean;
    };
    err.status = response.status;
    err.configuration_missing = body?.configuration_missing;
    throw err;
  }

  return body as ResearchResponse;
}

export const api = {
  listIncidents,
  getIncident,
  getIncidentDetail,
  createIncident,
  updateIncident,
  updateIncidentStatus,
  addEvidence,
  updateTaskStatus,
  addTask,
  getAIAnalysisRuns,
  runAIInvestigation,
  addWebSearchEvidence,
  runResearch,
};

export type { Severity, Environment };
