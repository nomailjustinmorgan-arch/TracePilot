# TracePilot — Incident Investigation Platform

TracePilot is a structured incident investigation platform that helps teams separate observed facts from assumptions and guides them toward verifiable actions. It integrates real web research (Tavily Search API) and AI-powered analysis (NVIDIA Nemotron via Nebius Token Factory) into a unified investigation workspace.

## Workflow

```
Incident report → Tavily web research → user-reviewed evidence ledger → Nemotron investigation via Nebius → prioritised action plan → verification
```

1. **Report an incident** — Start with a title, description, affected service, severity, and initial context.
2. **Build the evidence ledger** — Add notes, reference URLs, and web-search results. Each item is tagged with its source type and verification state.
3. **Research with Tavily** — Search the web for relevant documentation, known issues, and troubleshooting guides. Results are retrieved through the Tavily Search API and marked as unverified until independently confirmed. Add useful sources directly to the evidence ledger.
4. **Run AI investigation** — NVIDIA Nemotron (via Nebius Token Factory) analyses the incident and all evidence in the ledger, generating findings, hypotheses, and prioritized actions. AI-generated items are clearly labelled with an "AI" badge.
5. **Track the action plan** — Work through verification steps for each task. Mark items as Open, In Progress, or Complete.

### Important caveats

- **Tavily research results are supporting material, not independently verified facts.** A search excerpt does not prove a claim is true. Evidence must be reviewed and interpreted in context.
- **AI analysis and web research are separate services** — each requires its own credentials. Tavily search works independently of Nebius/Nemotron and vice versa.
- **Live Nemotron inference requires a valid NEBIUS_API_KEY.** Without it, the AI investigation panel shows a configuration error. The implementation is complete and deployed — only the credential is missing.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide icons
- **Backend:** Supabase (PostgreSQL, RLS, Edge Functions)
- **AI:** NVIDIA Nemotron via Nebius Token Factory (OpenAI-compatible API)
- **Web Research:** Tavily Search API

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root (this file is gitignored and will not be committed):

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

These are the only client-side environment variables. They contain the public anon key, which is safe for browser use.

### Server-side secrets

The following secrets must be configured in your Supabase project under Edge Functions > Secrets. They are never exposed to the browser.

| Secret name | Purpose | Required for |
|---|---|---|
| `TAVILY_API_KEY` | Tavily Search API authentication | Web research |
| `NEBIUS_API_KEY` | Nebius Token Factory API authentication | AI investigation |
| `NEBIUS_MODEL` | Override the default model (optional) | AI investigation |

Default model: `nvidia/Nemotron-3_5-Lightning`

### Running the development server

```bash
npm run dev
```

### Production build

```bash
npm run build
npm run preview
```

### Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Architecture

### Database

Supabase PostgreSQL with Row Level Security enabled on all tables. The app is single-tenant with no authentication, so policies use `TO anon, authenticated` with permissive predicates.

**Tables:**
- `incidents` — Top-level investigation records
- `evidence` — Evidence ledger entries (notes, reference URLs, web-search results)
- `findings` — Classified findings (observed / inferred / unknown)
- `action_tasks` — Remediation tasks with verification steps
- `ai_analysis_runs` — AI analysis history with full result JSON

**Evidence source types:** `note`, `reference_url`, `web_search`
**Verification states:** `user_provided`, `externally_verified`, `retrieved_unverified`

### Edge Functions

#### tracepilot-research

Calls the Tavily Search API (`https://api.tavily.com/search`) with a query built from the incident context. Returns validated search results to the client for user review before adding to the evidence ledger.

#### tracepilot-investigate

Calls the Nebius Token Factory chat completions API (`https://api.tokenfactory.nebius.com/v1/chat/completions`) with NVIDIA Nemotron to generate an evidence-grounded investigation analysis. The system prompt enforces evidence-conscious behaviour: no invented evidence, clear separation of observed vs inferred vs unknown, and only non-destructive action recommendations.

### Frontend structure

```
src/
  components/
    ui/           — Reusable UI primitives (Badge, Button, Card, Modal, States)
    workspace/    — Investigation workspace components
      EvidenceLedger.tsx
      ResearchPanel.tsx
      FindingsPanel.tsx
      ActionPlan.tsx
      AIIntegrationPanel.tsx
  lib/
    api.ts        — API functions (Supabase queries + edge function calls)
    supabase.ts   — Supabase client
    types.ts      — TypeScript types
    format.ts     — Date/time formatting
    router.tsx    — Lightweight hash-based router
  pages/
    OverviewPage.tsx
    InvestigationsListPage.tsx
    InvestigationWorkspace.tsx
    NewInvestigationPage.tsx
    HowItWorksPage.tsx
    NotFoundPage.tsx
```

## Database Migrations

Migrations are in `supabase/migrations/` and are applied via the Supabase MCP tool:

1. `20261022121232_tracepilot_phase1_schema.sql` — Core tables (incidents, evidence, findings, action_tasks)
2. `20261022125556_tracepilot_phase2_ai_analysis.sql` — AI analysis runs table + `is_ai` flags

## Integration Status

| Integration | Status | Notes |
|---|---|---|
| Supabase persistence | Live | All CRUD operations working |
| Tavily web research | Live | Real search results verified with configured API key |
| NVIDIA Nemotron via Nebius | Implemented, awaiting credentials | Function deployed and tested — returns correct configuration-missing error. Live inference requires `NEBIUS_API_KEY` to be added to Supabase secrets. |

## Troubleshooting

### "Tavily API key is not configured"
Add the `TAVILY_API_KEY` secret in Supabase Dashboard > Edge Functions > Secrets.

### "Nebius API key is not configured"
Add the `NEBIUS_API_KEY` secret in Supabase Dashboard > Edge Functions > Secrets. The key must be valid for the Nebius Token Factory API.

### Edge function not deploying
Ensure `supabase/config.toml` has a `[functions.<slug>]` table with `verify_jwt = false` for each function.

### Build fails with missing Supabase env vars
Ensure `.env` exists with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Licence

MIT — see [LICENSE](LICENSE).
