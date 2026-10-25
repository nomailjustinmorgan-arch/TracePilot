// TracePilot Research Edge Function — Phase 3
// Real Tavily web search for incident evidence research
// Calls the Tavily Search API to retrieve real web-search results for
// incident investigation research. Results are returned to the client
// for user review before being added to the evidence ledger.
//
// Provider: Tavily
// Endpoint: https://api.tavily.com/search
// Auth:     Bearer <TAVILY_API_KEY> (server-side secret only)

import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TAVILY_ENDPOINT = "https://api.tavily.com/search";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_QUESTION_LENGTH = 500;
const MAX_QUERY_LENGTH = 1000;
const MAX_RESULTS = 5;
const MAX_CONTENT_CHARS = 2000;
const MAX_TITLE_CHARS = 300;

interface IncidentRow {
  id: string;
  title: string;
  description: string;
  affected_service: string;
  environment: string;
  severity: string;
  status: string;
}

interface ResearchResult {
  title: string;
  url: string;
  content: string;
  score: number | null;
  published_date: string | null;
  position: number;
}

interface ResearchResponse {
  query: string;
  results: ResearchResult[];
  elapsed_ms: number;
  usage_credits: number | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const body = await req.json();
    const incidentId = body?.incidentId;
    const userQuestion = typeof body?.question === "string" ? body.question.trim() : "";

    if (!incidentId || typeof incidentId !== "string") {
      return jsonResponse(400, { error: "incidentId is required" });
    }

    if (userQuestion.length > MAX_QUESTION_LENGTH) {
      return jsonResponse(400, { error: `Research question must be ${MAX_QUESTION_LENGTH} characters or fewer` });
    }

    // --- Supabase client with service role ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(500, { error: "Server database configuration is missing" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // --- Load canonical incident from DB ---
    const { data: incident, error: incError } = await supabase
      .from("incidents")
      .select("id,title,description,affected_service,environment,severity,status")
      .eq("id", incidentId)
      .maybeSingle();

    if (incError) {
      return jsonResponse(500, { error: "Failed to load incident from database" });
    }

    if (!incident) {
      return jsonResponse(404, { error: "Incident not found" });
    }

    // --- Check TAVILY_API_KEY ---
    const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
    if (!tavilyApiKey) {
      return jsonResponse(503, {
        error:
          "Tavily API key is not configured. Add the TAVILY_API_KEY secret to enable web research.",
        configuration_missing: true,
      });
    }

    // --- Build search query from incident context + user question ---
    const inc = incident as IncidentRow;
    const query = buildSearchQuery(inc, userQuestion);

    if (!query) {
      return jsonResponse(400, { error: "Could not construct a search query from the incident details" });
    }

    // --- Call Tavily ---
    const startTime = Date.now();
    let responseBody: Record<string, unknown>;
    let responseStatus: number;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const apiResponse = await fetch(TAVILY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tavilyApiKey}`,
        },
        body: JSON.stringify({
          query: query,
          search_depth: "basic",
          topic: "general",
          max_results: MAX_RESULTS,
          include_answer: false,
          include_raw_content: false,
          include_published_date: true,
          include_usage: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      responseStatus = apiResponse.status;
      responseBody = await apiResponse.json();
    } catch (fetchErr) {
      const elapsedMs = Date.now() - startTime;
      const errMsg =
        fetchErr instanceof DOMException && fetchErr.name === "AbortError"
          ? "Request to Tavily timed out"
          : "Network error contacting Tavily API";

      return jsonResponse(504, { error: errMsg, elapsed_ms: elapsedMs });
    }

    const elapsedMs = Date.now() - startTime;

    // --- Handle provider errors ---
    if (responseStatus === 401 || responseStatus === 403) {
      return jsonResponse(502, {
        error: "Tavily authentication failed. The API key may be invalid or expired.",
        elapsed_ms: elapsedMs,
      });
    }

    if (responseStatus === 429) {
      return jsonResponse(429, {
        error: "Tavily API rate limit reached. Please try again shortly.",
        elapsed_ms: elapsedMs,
      });
    }

    if (responseStatus === 402) {
      const errObj = responseBody?.detail as string | undefined;
      return jsonResponse(402, {
        error: errObj || "Tavily API usage limit exhausted. Check your plan quota.",
        elapsed_ms: elapsedMs,
      });
    }

    if (responseStatus >= 500) {
      const errObj = responseBody?.detail as string | undefined;
      const providerMsg = errObj || `Tavily server error (${responseStatus})`;
      return jsonResponse(502, { error: `Tavily provider error: ${providerMsg}`, elapsed_ms: elapsedMs });
    }

    if (responseStatus !== 200) {
      const errObj = responseBody?.detail as string | undefined;
      const providerMsg = errObj || `Unexpected response (${responseStatus})`;
      return jsonResponse(502, { error: `Tavily returned: ${providerMsg}`, elapsed_ms: elapsedMs });
    }

    // --- Parse and validate results ---
    const rawResults = responseBody?.results;
    if (!Array.isArray(rawResults)) {
      return jsonResponse(502, {
        error: "Tavily returned an unexpected response format (no results array)",
        elapsed_ms: elapsedMs,
      });
    }

    const validatedResults: ResearchResult[] = [];
    for (let i = 0; i < rawResults.length; i++) {
      const raw = rawResults[i] as Record<string, unknown>;
      const url = typeof raw?.url === "string" ? raw.url : "";
      if (!isValidHttpUrl(url)) continue;

      const title = typeof raw?.title === "string"
        ? raw.title.slice(0, MAX_TITLE_CHARS)
        : url;

      const content = typeof raw?.content === "string"
        ? raw.content.slice(0, MAX_CONTENT_CHARS)
        : "";

      const score = typeof raw?.score === "number" ? raw.score : null;
      const publishedDate = typeof raw?.published_date === "string" ? raw.published_date : null;

      validatedResults.push({
        title: title || url,
        url,
        content,
        score,
        published_date: publishedDate,
        position: i,
      });
    }

    // --- Extract usage credits if present ---
    const usageObj = responseBody?.usage as Record<string, unknown> | undefined;
    const usageCredits = typeof usageObj?.credits_used === "number"
      ? usageObj.credits_used
      : null;

    const result: ResearchResponse = {
      query,
      results: validatedResults,
      elapsed_ms: elapsedMs,
      usage_credits: usageCredits,
    };

    return jsonResponse(200, result);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unexpected server error";
    console.error("tracepilot-research error:", errMsg);
    return jsonResponse(500, { error: "An unexpected error occurred during research" });
  }
});

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSearchQuery(incident: IncidentRow, userQuestion: string): string {
  if (userQuestion) {
    const ctx = `${incident.affected_service} ${incident.environment} ${incident.title}`;
    const combined = `${userQuestion} ${ctx}`.trim();
    return combined.slice(0, MAX_QUERY_LENGTH);
  }

  const descSnippet = incident.description.slice(0, 200).replace(/\n+/g, " ");
  const defaultQuery = `${incident.affected_service} ${incident.title} ${descSnippet}`.trim();
  return defaultQuery.slice(0, MAX_QUERY_LENGTH);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
