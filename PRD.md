# ContractLens — Implementation PRD (for Claude to build, phase by phase)

> **How to use this file:** Put it in the repo root as `PRD.md` (or paste it into Claude Code / Google Antigravity / Cursor as the first message). Say: **"Read PRD.md. Start with Phase 0."**
> The PRD is the single source of truth. If something is unclear, Claude must ask before coding, not guess.

---

## 0. Instructions to the AI builder (read first, obey always)

### 0.1 Operating protocol
1. Work on **exactly one phase at a time**. Never start the next phase until the user says **"next"**.
2. At the end of every phase, Claude must output this block, in this order:
   - **✅ What was built** (max 5 bullets)
   - **🧪 How to test this phase** (exact commands + what to click + expected result)
   - **🛠 Setup the user must do** (accounts, env vars, dashboards — step by step, only if this phase needs any)
   - **⚠️ Known limits** (honest, max 3 bullets)
   - **➡️ Ask:** *"Phase N works? Reply `next` to start Phase N+1, or tell me what to fix."*
3. Before finishing a phase, Claude must run `pnpm typecheck && pnpm lint && pnpm test` and fix failures. Never claim something works without running it.
4. Commit at the end of each phase with message `phase-N: <summary>`.
5. If a requirement conflicts with the "AI budget rule" (§2), the AI budget rule wins.

### 0.2 Code style rules
- TypeScript strict. No `any`. Small files (target < 150 lines). One responsibility per file.
- Reusable logic lives in `src/lib/*`. UI components never talk to the DB or AI directly.
- No dead code, no speculative abstractions, no unused dependencies. Add a dependency only if listed in §4 or truly needed (and say why).
- Comments only for *why*, not *what*.
- Secrets only via environment variables, server-side only. Never `NEXT_PUBLIC_` for keys. `.env.local` is git-ignored; `.env.example` is committed.

### 0.3 Repository hygiene (important for review)
- **Do NOT copy the assignment text, problem statement, or evaluation details into the repo or README.** The README describes only what the app does and how to run it.
- The product is an **information-management tool, not legal advice**. This disclaimer appears in the UI footer, the summary page, and the README.

---

## 1. Product

**Name:** ContractLens
**One-liner:** Turn a contract into traceable, reviewable, deadline-ready obligations — with exactly one AI call per upload.

### 1.1 USP (say this in the README top and in the demo)
**"Evidence-first, one-hit contract intelligence."**
1. **Every finding carries a verified quote.** The AI proposes a quote; *our code* verifies it exists in the document and computes the page/section. Unverifiable findings are flagged, never shown as confirmed.
2. **One upload = one AI request.** Extraction, ambiguity detection, clarification questions, and policy comparison all come from a single structured call. Everything else (dates, stale detection, summary, charts) is deterministic code — fast, free, and testable.
3. **The AI never decides.** Review status is controlled by humans; deadlines are computed by code with a visible calculation basis.
4. **Versions are safe.** Upload v2 and any approved finding whose evidence changed is flagged "potentially stale". User corrections are never overwritten.

### 1.2 Scope
**In scope (core only):** upload PDF / DOCX / pasted text; optional policy document (text/pasted/PDF/DOCX); extraction; evidence verification; review workspace (edit/approve/reject); deterministic deadlines + reminders; version history + stale marking; reviewed summary (printable); honest dashboard.

**Out of scope (do not build):** e-signatures, calendar integration, OCR, payments, legal recommendations, RAG/vector search/chat, multi-user auth, multi-contract analytics. *(RAG is deliberately skipped: it costs extra AI/embedding calls and does not help the USP.)*

### 1.3 Users and flow
Single demo workspace, no login (state clearly in README: "no auth by design, demo only; do not upload confidential contracts").

```
Upload/paste contract (+ optional policy)
  → parse text (deterministic)
  → ONE AI call (structured JSON)
  → validate with Zod → verify quotes → compute locations & deadlines
  → Review workspace (edit / approve / reject)
  → Upcoming deadlines · Reviewed summary · Dashboard
  → Upload v2 → stale flags
```

---

## 2. AI budget rule (non-negotiable)

| Action | AI calls |
|---|---|
| Upload contract v1 (with or without policy) | **exactly 1** |
| Upload contract v2 | **exactly 1** |
| Edit / approve / reject | 0 |
| Deadline calculation | 0 |
| Stale detection / version compare | 0 |
| Reviewed summary | 0 (template built from DB) |
| Dashboard | 0 (SQL) |
| Malformed AI output | **0 automatic retries.** Salvage valid items; show a manual "Re-run extraction" button (user-triggered, counts as a new call) |

Rules for the single call:
- `temperature: 0`, JSON-only output, compact prompt, `max_tokens` capped (e.g. 4000).
- Send the document **once**; if a policy is attached, include it in the same prompt under a clearly marked section.
- Model returns **quotes only** — never page numbers or section labels (models guess those). Code computes them.
- Log every call: provider, model, input chars, latency ms, token usage if returned, success/failure → stored as an `audit_events` row (`type = 'ai_call'`).
- Add a test that proves one upload triggers exactly one provider call (mock the adapter, assert call count = 1).

Input size guard: if the combined text exceeds `MAX_INPUT_CHARS` (default 60,000), truncate at a paragraph boundary, store `truncated = true`, and show a visible warning banner. Never silently drop text.

---

## 3. Free + open-source strategy

- **Code:** MIT license, public GitHub repo.
- **Hosting:** Vercel Hobby (free) + Neon Free Postgres.
- **AI provider (one, behind an adapter):** OpenRouter with an **open-weight free model** (e.g. a free Llama/Qwen/DeepSeek-family model). Free model IDs change often, so the model name is an env var, never hardcoded.
  - Fallback option: Gemini API free tier (same adapter interface; not open-weight).
  - **Phase 1 must include a provider smoke test script** (`pnpm ai:test`) that makes one real request and prints model, latency, and whether JSON mode worked. If the chosen model fails, switch via env only.
- **`AI_PROVIDER=mock`:** returns a fixed fixture extraction for the synthetic demo contract. Used for tests and as an emergency demo fallback. The UI must show a visible **"Sample output (mock provider)"** badge when active — never pass mock output off as real AI.
- No paid services anywhere. No credit card needed.

---

## 4. Tech stack (fixed — do not substitute)

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript, pnpm | one deployable unit |
| UI | Tailwind CSS + shadcn/ui | fast, clean |
| Charts | Recharts | simple |
| DB | Neon PostgreSQL via `@neondatabase/serverless` | free, serverless-friendly |
| ORM/migrations | Drizzle ORM + drizzle-kit | light, typed, readable |
| Validation | Zod | schema for AI output and API input |
| PDF parsing | `unpdf` (per-page text, serverless-safe) | keeps page numbers |
| DOCX parsing | `mammoth` (raw text) | standard |
| Dates | `date-fns` | deterministic date math |
| Tests | Vitest | fast |
| Lint/format | ESLint + Prettier | standard |

No pgvector, no LangChain, no auth library, no state-management library.

---

## 5. Project structure (create exactly this)

```
contractlens/
├─ PRD.md
├─ README.md
├─ LICENSE
├─ .env.example
├─ drizzle.config.ts
├─ package.json
├─ samples/
│  ├─ synthetic-contract-v1.txt        # safe fake contract for demo
│  ├─ synthetic-contract-v2.txt        # changed notice period + new clause
│  └─ synthetic-policy.txt
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                    # footer disclaimer
│  │  ├─ page.tsx                      # contracts list + upload entry
│  │  ├─ contracts/new/page.tsx        # upload form
│  │  ├─ contracts/[id]/page.tsx       # review workspace (latest version)
│  │  ├─ contracts/[id]/summary/page.tsx
│  │  ├─ contracts/[id]/versions/page.tsx
│  │  ├─ dashboard/page.tsx
│  │  └─ api/
│  │     ├─ contracts/route.ts                 # POST create contract + v1
│  │     ├─ contracts/[id]/versions/route.ts   # POST upload new version
│  │     ├─ contracts/[id]/rerun/route.ts      # POST manual re-extraction
│  │     ├─ findings/[id]/route.ts             # PATCH edit/approve/reject
│  │     └─ health/route.ts
│  ├─ components/
│  │  ├─ ui/                           # shadcn generated
│  │  ├─ UploadForm.tsx
│  │  ├─ FindingCard.tsx
│  │  ├─ EvidenceQuote.tsx
│  │  ├─ StatusBadge.tsx
│  │  ├─ DeadlineList.tsx
│  │  ├─ StatCards.tsx
│  │  ├─ Charts.tsx
│  │  └─ Disclaimer.tsx
│  ├─ lib/
│  │  ├─ env.ts                        # Zod-validated env
│  │  ├─ db/ (client.ts, schema.ts, queries.ts)
│  │  ├─ parse/ (index.ts, pdf.ts, docx.ts, text.ts, pages.ts)
│  │  ├─ ai/ (adapter.ts, openrouter.ts, gemini.ts, mock.ts, prompt.ts, schema.ts)
│  │  ├─ evidence/ (normalize.ts, verify.ts, locate.ts)
│  │  ├─ deadlines/ (compute.ts, reminders.ts)
│  │  ├─ versions/ (compare.ts)
│  │  ├─ summary/ build.ts
│  │  └─ services/ (ingest.ts, review.ts)   # orchestration, the only layer API routes call
│  └─ types/index.ts
└─ tests/
   ├─ parse.test.ts  evidence.test.ts  deadlines.test.ts
   ├─ versions.test.ts  extraction-pipeline.test.ts  review.test.ts
   └─ fixtures/
```

Layering rule: `app/api/*` → `lib/services/*` → `lib/{parse,ai,evidence,deadlines,versions,db}`. Pages read via `lib/db/queries.ts` in server components. Nothing skips a layer.

---

## 6. Data model (minimal — 4 tables)

```
contracts
  id uuid pk · title text · created_at

contract_versions
  id uuid pk · contract_id fk · version_number int · source_kind ('pdf'|'docx'|'text')
  file_name text null · full_text text · pages jsonb null   -- [{page, start, end}]
  policy_text text null · truncated bool · ai_provider text · ai_model text
  extraction_status ('ok'|'partial'|'failed') · extraction_error text null
  created_at · unique(contract_id, version_number)

findings
  id uuid pk · version_id fk · type text   -- party|effective_date|expiry|renewal|termination|notice|obligation|conflict|ambiguity|policy_mismatch
  title text · ai_value text · ai_responsible_party text null
  certainty ('confirmed'|'uncertain') · uncertainty_reason text null
  clarification_question text null
  evidence_quote text · evidence_status ('verified'|'unverified')
  page int null · section text null · char_start int null · char_end int null
  deadline_spec jsonb null             -- AI-proposed structure, see §8
  deadline_date date null · deadline_basis text null · deadline_flag text null  -- computed by code
  review_status ('pending'|'approved'|'rejected'|'potentially_stale')
  corrected_value text null · corrected_responsible_party text null · corrected_deadline_date date null
  reviewed_at timestamptz null · stale_reason text null
  carried_from_finding_id uuid null
  created_at

audit_events
  id · contract_id · version_id null · finding_id null
  type ('upload'|'ai_call'|'edit'|'approve'|'reject'|'stale_flag'|'rerun')
  detail jsonb · created_at
```

Rules:
- **AI fields (`ai_*`) are immutable.** User edits go to `corrected_*`. Display value = `corrected_* ?? ai_*`.
- Review status is only changed by the review service, never by AI output.
- Deletes: none. Rejecting is a status.

---

## 7. AI contract (single call)

### 7.1 Output schema (Zod, in `lib/ai/schema.ts`)
```ts
{
  parties: [{ name, role | null, quote }],
  effective_date: { value: "YYYY-MM-DD" | null, quote | null, certainty, uncertainty_reason | null } ,
  findings: [{
    type: "expiry"|"renewal"|"termination"|"notice"|"obligation"|"conflict"|"ambiguity"|"policy_mismatch",
    title, value, quote,
    responsible_party: string | null,
    certainty: "confirmed"|"uncertain",
    uncertainty_reason: string | null,
    clarification_question: string | null,
    deadline: {
      anchor: "effective_date"|"expiry_date"|"fixed_date"|"event"|null,
      fixed_date: "YYYY-MM-DD" | null,
      amount: number | null,
      unit: "days"|"weeks"|"months"|"years"|null,
      direction: "before"|"after"|null,
      day_type: "calendar"|"business"|"unspecified"
    } | null
  }]
}
```
Parties and the effective date are normalized into `findings` rows (`party`, `effective_date`) by the ingest service.

### 7.2 Prompt rules (`lib/ai/prompt.ts`)
The system prompt must say, in compact form:
- You extract information; you do not give legal advice or recommendations.
- Return **only** valid JSON matching the schema. No prose, no markdown fences.
- Every item needs `quote`: **copy text verbatim** from the document, ≤ 300 chars, one contiguous passage.
- Do **not** output page numbers or section numbers.
- If something is unclear, conflicting, or missing a date logic, set `certainty: "uncertain"`, fill `uncertainty_reason`, and write a `clarification_question`.
- Use `null` for unknown values. Never invent dates or names.
- Use `type: "conflict"` when two clauses contradict (quote the first; mention the second in `value`).
- If a POLICY section is present, add `policy_mismatch` findings where the contract departs from the policy, quoting the **contract** text.
- Resolve dates only when stated explicitly; otherwise leave `fixed_date: null` and describe the rule via `amount/unit/direction/anchor`.

### 7.3 Adapter interface (`lib/ai/adapter.ts`)
```ts
interface AiProvider { name: string; model: string;
  extract(input: { contractText: string; policyText?: string }): Promise<{ rawJson: string; usage?: {...}; latencyMs: number }>;
}
```
`getProvider()` reads `AI_PROVIDER` (`openrouter` | `gemini` | `mock`). Provider code does only HTTP + JSON mode; all validation lives in `schema.ts`. Timeout 45 s, no retries.

### 7.4 Malformed output handling
1. Strip accidental code fences, `JSON.parse`. If this fails → `extraction_status = 'failed'`, store error, show "Extraction failed — Re-run" (manual).
2. If top-level parses but some items fail Zod → keep valid items (`partial`), list the dropped count in UI.
3. Never crash the upload; the contract and version are always saved with text so the user can retry.

---

## 8. Deterministic logic

### 8.1 Evidence verification (`lib/evidence`)
- `normalize(s)`: lowercase, collapse whitespace, unify curly quotes/dashes, strip hyphenated line-break artifacts.
- `verify`: normalized quote must be a substring of normalized full text → `verified`. Otherwise `unverified` (red badge: "Quote not found in document — treat as unconfirmed").
- **Unverified findings are forced to `certainty = 'uncertain'`** and cannot be bulk-approved; approving one requires an explicit confirm click.
- `locate`: map the match back to original char offsets; derive `page` from `pages` offsets (null for pasted text); derive `section` as the nearest preceding heading line matching `/^(article|section|clause)?\s*\d+(\.\d+)*[.)]?\s+\S/i`. If none → `section = null` shown as "Section unavailable". Never guess.

### 8.2 Deadlines (`lib/deadlines`)
- Resolve the **effective date** and **expiry date** first:
  - expiry = fixed date if given; else effective date ± term (`amount/unit`); else unresolved.
- For each finding with `deadline`:
  - `fixed_date` → use as-is.
  - anchor `expiry_date`/`effective_date` + amount/unit/direction → compute with `date-fns` (`addDays/addMonths/addYears`, `subDays`…).
  - `day_type = 'business'` → skip weekends only (state "holidays not considered" in the basis).
  - `unspecified` day type → default to calendar days **and set `deadline_flag = 'assumed_calendar_days'`**.
  - anchor `event` or any missing piece → `deadline_date = null`, `deadline_flag = 'needs_human_date'`.
- `deadline_basis` is a human-readable string, e.g. `"Expiry 2027-03-31 minus 60 calendar days (assumed calendar days)"`.
- Reminders (`reminders.ts`): for each dated item, reminders at **30, 14, 7 and 1 days before** the deadline; only future ones are shown. Pure function `(deadline, today) → Date[]`; `today` is injected so tests are deterministic.
- When the user corrects a date, store `corrected_deadline_date`; basis becomes "User-corrected".
- Recompute deadlines whenever an expiry/effective finding is edited (single service function, no AI).

### 8.3 Version compare & stale marking (`lib/versions/compare.ts`)
On upload of version N+1 (after its single AI call and verification):
For every finding in version N that is `approved` (or has a user correction):
1. Match to a v(N+1) finding by same `type` and best normalized-quote similarity (token Jaccard ≥ 0.8).
2. **No match, or old quote not found in new text** → mark the *old* finding `potentially_stale` with `stale_reason = "Evidence not found in version N+1"`.
3. **Matched but value or deadline differs** → old finding `potentially_stale`, reason `"Value changed in version N+1"`; show both side by side.
4. **Matched and identical** → carry forward: the new finding is created `approved` with `carried_from_finding_id` and the previous corrections copied. Audit event `stale_flag` not needed.
5. Unmatched new findings arrive as `pending`.
Never delete or edit old versions; corrections stay on the old rows and are visible in history.

### 8.4 Reviewed summary (`lib/summary/build.ts`) — zero AI
Template from DB data, grouped:
1. Parties & effective date (approved only, else "Pending review")
2. Term, renewal, termination & notice (approved)
3. Obligations & upcoming deadlines (approved, sorted by date, with basis)
4. **Pending / uncertain / stale items** (clearly separated, with clarification questions)
5. Rejected items count
Always ends with the disclaimer. Printable via `@media print` CSS (Print button → browser "Save as PDF").

### 8.5 Dashboard — zero AI
Server-side SQL aggregates for the **current contract**: total versions, findings by `review_status` (bar/pie), findings by `type`, upcoming deadlines bucketed (Overdue / ≤7d / ≤30d / ≤90d / later), counts of uncertain, unverified, stale. Honest empty states ("No dated items yet"). Multi-contract totals appear only as a simple contracts list, not as fake analytics.

---

## 9. Environment variables (`.env.example`)

```
DATABASE_URL=postgresql://...            # Neon pooled connection string
AI_PROVIDER=openrouter                   # openrouter | gemini | mock
OPENROUTER_API_KEY=
OPENROUTER_MODEL=                        # a currently-free open-weight model id
GEMINI_API_KEY=
GEMINI_MODEL=
MAX_INPUT_CHARS=60000
MAX_UPLOAD_MB=5
```
`lib/env.ts` validates with Zod at startup and throws a clear message naming the missing variable.

---

## 10. Phases

> Each phase ends with the **protocol block from §0.1** — including testing steps and a "reply `next`" prompt.

### Phase 0 — Accounts & setup guide (no code)
**Goal:** user has every account/key ready before coding.
Claude outputs a numbered, click-by-click guide for:
1. **GitHub:** create empty public repo `contractlens`.
2. **Neon:** sign up → Create project → region closest to user → copy the **pooled** connection string → save as `DATABASE_URL`.
3. **OpenRouter:** sign up → Keys → create key → Models, filter "free" → pick an open-weight model that supports JSON/structured output → note its exact ID. *(Tell the user free quotas/models change; the smoke test in Phase 1 confirms.)*
4. **Vercel:** sign up with GitHub (do not deploy yet).
5. Local tools: Node 20+, pnpm, git.
**Test:** user replies with a checklist confirming the 5 items (never ask them to paste secrets into chat).
**Ask:** "Reply `next` for Phase 1."

### Phase 1 — Scaffold, DB, AI smoke test
**Tasks:** create Next.js + TS + Tailwind + shadcn app; folder structure from §5; `env.ts`; Drizzle schema (§6) + first migration; `db/client.ts`; `/api/health` (checks DB with `select 1`); `lib/ai/adapter.ts` + `openrouter.ts` + `mock.ts`; script `pnpm ai:test` (one real call with a tiny sample, prints model, latency, JSON-valid yes/no); ESLint, Prettier, Vitest; scripts `typecheck`, `lint`, `test`, `db:push`; `.gitignore`; MIT LICENSE; footer `Disclaimer`.
**User setup:** copy `.env.example` → `.env.local`, fill values; run `pnpm db:push`.
**Acceptance:** `pnpm dev` runs; `/api/health` returns `{ db: "ok" }`; `pnpm ai:test` prints success with the real model (or clear failure message); `AI_PROVIDER=mock pnpm ai:test` passes.
**Test steps to show:** the commands above + opening `localhost:3000` and seeing the disclaimer.

### Phase 2 — Ingestion (parse only, no AI)
**Tasks:** `lib/parse/*`: PDF via `unpdf` (pages array + offsets), DOCX via `mammoth`, pasted text; unified `parseDocument(file|text) → { text, pages|null, kind }`. Reject: unsupported type, > `MAX_UPLOAD_MB`, empty text (e.g. scanned PDF → message "No extractable text. OCR is not supported."). Upload form (file or paste, optional policy file/paste). A temporary debug route/page showing parsed text and page count. Create `samples/*` synthetic contracts (must contain: parties, effective date, 1-year term, auto-renewal, 60-day non-renewal notice, termination for convenience with 30-day notice, payment within 30 days, one ambiguity such as "reasonable notice", one conflict such as two different notice periods; v2 changes notice to 90 days and adds a data-deletion obligation).
**Acceptance / tests:** unit tests for text, DOCX fixture, PDF fixture, empty file, wrong type, oversized file.
**Test steps:** upload each sample type in the UI and see parsed text; try a `.png` and an empty file and see friendly errors.

### Phase 3 — The one AI call: extraction + evidence
**Tasks:** `ai/prompt.ts`, `ai/schema.ts` (Zod), `openrouter.ts` (JSON mode, 45 s timeout, no retry), `evidence/{normalize,verify,locate}.ts`, `services/ingest.ts` (`parse → truncate guard → 1 AI call → salvage-validate → verify → locate → save version + findings + audit ai_call`), `POST /api/contracts`, minimal results page listing findings with quote, page/section, certainty, verified badge.
**Acceptance:**
- Uploading the sample creates a contract, version 1, and findings.
- Provider adapter called exactly once (test).
- Fabricated quote in mock fixture → `unverified` + forced `uncertain`.
- Malformed JSON → version saved with `failed` and a Re-run button (`POST /api/contracts/[id]/rerun`).
- Truncation warning appears for oversize input.
**Tests:** `evidence.test.ts`, `extraction-pipeline.test.ts` (mock provider: success, partial, malformed, thrown error, timeout).
**Test steps:** upload sample with `AI_PROVIDER=openrouter` and note latency; repeat with `mock`; check `audit_events` has exactly one `ai_call` row per upload.

### Phase 4 — Review workspace
**Tasks:** `FindingCard` (type, title, display value, responsible party, `EvidenceQuote` with page/section or "unavailable", certainty badge, clarification question, status badge); actions **Edit** (value, responsible party, date) / **Approve** / **Reject**; `PATCH /api/findings/[id]` via `services/review.ts`; audit events with timestamps; filters (status, type, responsible party) as simple client-side filter chips; unverified findings need confirm-to-approve; "Reset to AI value" for edits.
**Acceptance:** edits keep `ai_value` intact; reload preserves state; `reviewed_at` set; zero AI calls on any review action (test).
**Tests:** `review.test.ts` (approve, reject, edit, immutability of `ai_*`, unverified confirm rule).

### Phase 5 — Deadlines & reminders
**Tasks:** `deadlines/compute.ts`, `deadlines/reminders.ts`; run during ingest and after relevant edits; `DeadlineList` ("Upcoming" section on the workspace sorted by date: item, date, basis, source clause link, flag badges for `needs_human_date` / `assumed_calendar_days`); date correction field.
**Acceptance:** sample's 60-day renewal notice shows the correct computed date and basis; "reasonable notice" shows "Needs human date", not a guess.
**Tests:** `deadlines.test.ts` — calendar vs business days, month-end (Jan 31 + 1 month), leap year, `before` vs `after`, missing anchor, unresolved expiry, injected `today`, past-due items, reminder filtering.

### Phase 6 — Versions & stale detection
**Tasks:** `POST /api/contracts/[id]/versions` (same ingest pipeline, 1 AI call), `versions/compare.ts` per §8.3, versions page (list, upload date, finding counts, side-by-side for changed items), stale banner on workspace ("3 previously approved items may be outdated — please re-review"), audit `stale_flag`, carry-forward of unchanged approvals.
**Acceptance:** upload `v2` sample → notice-period finding flagged `potentially_stale` with both values visible; unchanged approvals carried forward; old version and corrections intact.
**Tests:** `versions.test.ts` (unchanged, changed value, removed clause, new clause, corrected-then-changed, no silent overwrite).

### Phase 7 — Summary & dashboard
**Tasks:** `summary/build.ts` + summary page + print CSS; dashboard with `StatCards` and 3 Recharts charts (status, type, deadline windows) from SQL; empty states.
**Acceptance:** summary clearly separates approved vs pending/uncertain/stale; numbers match the DB (a test compares dashboard query output with fixture data).
**Test steps:** approve a few items, refresh summary and dashboard, print to PDF.

### Phase 8 — Hardening & polish
**Tasks:** error boundary + toasts; loading state on upload ("Analyzing… one AI request"); friendly messages for provider down / quota exceeded / timeout; request size limits; structured server logs (`event`, `contractId`, `latencyMs`, never contract text or keys); a11y pass (labels, focus, contrast); mobile layout check; remove debug routes; confirm no secrets in git history (`git log -p | grep -i key`).
**Acceptance:** full test suite green; manual failure drills pass: invalid file, empty PDF, bad JSON, wrong API key, DB unreachable.

### Phase 9 — Deploy & README
**User setup (Claude must give click-steps):**
1. Push to GitHub.
2. Vercel → Add New Project → import repo → add env vars from §9 → Deploy.
3. Run `pnpm db:push` against the Neon DB (same `DATABASE_URL`) if not done.
4. Set `export const maxDuration = 60` on the two upload routes; if the platform limits it lower, say so and reduce `MAX_INPUT_CHARS`.
**Tasks:** `README.md` with: USP, screenshots/GIF placeholders, features, architecture diagram (text), one-hit AI design, data model, setup (Neon, OpenRouter), env table, scripts, demo script (upload v1 → review → deadlines → upload v2 → stale → summary → dashboard), testing, limitations (no OCR, no auth, free-model variability, business days ignore holidays, section detection is heuristic), privacy note, responsible-AI-use note (tools used, human reviewed all code), disclaimer.
**Acceptance:** deployed URL passes the full demo script; `/api/health` ok in production; no secrets in repo or browser bundle.
**Final ask:** "Deployed. Want a final checklist run and a 60-second demo script?"

---

## 11. Definition of done (final checklist)

- [ ] Upload PDF, DOCX, or paste text; clear errors for bad input
- [ ] Exactly one AI request per upload (tested and logged)
- [ ] Parties, dates, clauses, obligations, ambiguities, conflicts, clarification questions shown
- [ ] Every finding shows a quote with verified/unverified status; page/section only when reliably known
- [ ] Edit / approve / reject with timestamps; AI values immutable, corrections preserved
- [ ] Deadlines computed in code with visible basis and flags; no guessed dates
- [ ] v2 upload flags stale approvals; nothing silently overwritten
- [ ] Reviewed summary (printable) and honest dashboard
- [ ] Optional policy comparison included in the same single call
- [ ] Disclaimer in UI, summary, README
- [ ] Tests green; typecheck and lint clean
- [ ] Deployed on Vercel with Neon; README complete; no secrets exposed
- [ ] Synthetic samples only — no real contracts

## 12. Cut list if time runs short (drop in this order)
1. Charts beyond status + deadline windows
2. Filters by responsible party
3. Side-by-side version diff UI (keep stale flags + reason text)
4. Gemini adapter
Never cut: evidence verification, one-call rule, review workflow, deterministic deadlines, stale marking, tests, README, deployment.
