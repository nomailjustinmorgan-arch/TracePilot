import { supabase } from './supabase';

const DEMO_MARKER = 'Customer Login Failures After Deployment';

export async function ensureSeedData(): Promise<void> {
  const { data: existing, error } = await supabase
    .from('incidents')
    .select('id')
    .eq('title', DEMO_MARKER)
    .eq('is_demo', true)
    .maybeSingle();

  if (error) {
    console.warn('Seed check failed:', error.message);
    return;
  }

  if (existing) return;

  const { data: incident, error: incError } = await supabase
    .from('incidents')
    .insert({
      title: 'Customer Login Failures After Deployment',
      description:
        'Some customers are unable to sign in following a recent application deployment. Other parts of the service appear to remain available. The precise cause has not yet been established.',
      affected_service: 'Authentication Service',
      environment: 'Production',
      severity: 'High',
      status: 'Investigating',
      is_demo: true,
    })
    .select()
    .single();

  if (incError || !incident) {
    console.warn('Seed incident insert failed:', incError?.message);
    return;
  }

  const incidentId = incident.id;

  await supabase.from('evidence').insert([
    {
      incident_id: incidentId,
      source_type: 'note',
      title: 'User-reported login failures',
      content:
        'Multiple customers reported being unable to sign in after the latest deployment. Reports appear to cluster within a narrow time window following the release.',
      verification_state: 'user_provided',
      is_demo: true,
    },
    {
      incident_id: incidentId,
      source_type: 'note',
      title: 'Partial impact on authentication',
      content:
        'Other parts of the service appear to remain available. Only the authentication flow seems affected, though the full scope has not been confirmed.',
      verification_state: 'user_provided',
      is_demo: true,
    },
    {
      incident_id: incidentId,
      source_type: 'note',
      title: 'Deployment timing (user-provided context)',
      content:
        'The deployment is reported to have occurred shortly before the first login failure reports. This timing is based on user-provided context, not independently verified telemetry.',
      verification_state: 'user_provided',
      is_demo: true,
    },
  ]);

  const { data: evidenceItems } = await supabase
    .from('evidence')
    .select('id')
    .eq('incident_id', incidentId);

  const evidenceIds = (evidenceItems ?? []).map((e) => e.id);

  await supabase.from('findings').insert([
    {
      incident_id: incidentId,
      title: 'Login failures have been reported',
      description:
        'Customers have reported being unable to sign in following the recent deployment. This is a direct observation from user reports.',
      classification: 'observed',
      confidence_explanation:
        'Directly reported by multiple customers. The existence of the problem is established, though the cause is not.',
      evidence_ids: evidenceIds.slice(0, 2),
      is_demo: true,
    },
    {
      incident_id: incidentId,
      title: 'Relationship with the deployment is plausible but not proven',
      description:
        'The timing of login failures appears to correlate with the recent deployment. However, correlation does not establish causation, and further investigation is needed.',
      classification: 'inferred',
      confidence_explanation:
        'Based on temporal proximity between the deployment and the first reports. No causal link has been verified yet.',
      evidence_ids: evidenceIds.length > 2 ? [evidenceIds[2]] : [],
      is_demo: true,
    },
    {
      incident_id: incidentId,
      title: 'Underlying failure mechanism and actual scope of impact remain to be established',
      description:
        'The root cause of the login failures, the exact number of affected users, and whether other services are impacted have not yet been determined.',
      classification: 'unknown',
      confidence_explanation:
        'No telemetry, logs, or diagnostic data have been reviewed yet. The scope and mechanism are open questions for the investigation.',
      evidence_ids: [],
      is_demo: true,
    },
  ]);

  await supabase.from('action_tasks').insert([
    {
      incident_id: incidentId,
      title: 'Confirm the affected login flows and scope',
      rationale: 'Need to determine which authentication paths are failing and how many users are impacted before prioritising a fix.',
      priority: 'High',
      status: 'Open',
      verification_steps: 'Collect affected user reports, identify the specific login flows that fail, and document the error messages users see.',
      is_demo: true,
    },
    {
      incident_id: incidentId,
      title: 'Review deployment and authentication service logs',
      rationale: 'Logs from the deployment and the auth service may reveal configuration changes, errors, or anomalies that coincide with the incident.',
      priority: 'High',
      status: 'Open',
      verification_steps: 'Pull auth service logs for the failure window, compare with pre-deployment baseline, and flag any new error patterns.',
      is_demo: true,
    },
    {
      incident_id: incidentId,
      title: 'Compare the failure window with deployment events',
      rationale: 'Establishing a precise timeline helps determine whether the deployment is causally linked to the failures or coincidental.',
      priority: 'Medium',
      status: 'Open',
      verification_steps: 'Create a timeline of deployment events and failure reports, identify any gap or overlap, and document the correlation.',
      is_demo: true,
    },
    {
      incident_id: incidentId,
      title: 'Define a verification test before closing the incident',
      rationale: 'A reproducible test confirms the issue is resolved and helps prevent regression in future deployments.',
      priority: 'Medium',
      status: 'Open',
      verification_steps: 'Write a test that reproduces the login failure, apply the fix, and confirm the test passes in a staging environment before closing.',
      is_demo: true,
    },
  ]);
}
