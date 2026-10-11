# Agent Usage & Interaction Log 🤖🛠️

This document describes the AI agent workflows, tools, representative user prompts, delegated tasks, key mistakes / rejected approaches, and verification protocols utilized during the development of **ContractLens**.

---

## 1. Tools Utilized

The AI assistant operated in a pair-programming environment with access to a suite of execution and inspection tools:

| Tool | Purpose | Typical Usage in Project |
|---|---|---|
| `run_command` | Execute shell commands in persistent/async terminals | Executing Vitest test suites, `next build`, `pnpm typecheck`, `eslint`, database migrations (`pnpm db:push`), and git operations. |
| `manage_task` | Inspect, manage, or terminate background processes | Monitoring async Vitest runs and background Next.js server processes (`pnpm start`, `pnpm dev`). |
| `view_file` | Read exact contents of files with line slicing | Inspecting schemas, components, test files, and server logs. |
| `replace_file_content` / `multi_replace_file_content` | Make targeted, atomic diff edits to existing code | Editing UI components (`ReviewWorkspace`, `StatCards`), API endpoints, and configuration files without overwriting unrelated logic. |
| `write_to_file` | Create new modules, tests, or documentation | Creating new components (`Toast.tsx`, `Dropdown.tsx`), test suites, and documentation files. |
| `grep_search` | Search codebase using ripgrep patterns | Finding references to symbols, CSS color codes, API routes, or deprecated props. |
| `list_dir` | Enumerate directories and inspect directory structures | Exploring components, routes, and test directories. |
| `browser_subagent` | Autonomous browser testing via CDP | Attempting visual interaction verification (when CDP is available). |

---

## 2. Representative User Prompts

The following prompts illustrate key milestones and user directives during project development:

1. **Architecture & Foundation:**
   > *"Phase 7 — Summary & Dashboard"*
   - Request to implement deterministic, zero-AI summary groups and native PostgreSQL aggregate dashboards.

2. **UX & Aesthetic Hardening:**
   > *"hase 8 (Hardening, Security & Polish) the entire webiste should be in light theme, internal scrolling, user friendly, fast, and ui similar to docusign"*
   - User directive to eliminate dark theme styles, establish DocuSign light aesthetic, introduce dual-pane independent internal scrolling, and eliminate page scroll runaway.

3. **Performance & Interaction Streamlining:**
   > *"still background is black in dark theme make it similar to docusign light theme in dashboards use redirections bring reusable dropdown componenrt anfd in home page internal scroll should be there with deleye and ui should be more user friendly with less clicks and dashboard should load fastly"*
   - Request for fast SQL aggregates, reusable dropdown switcher, 1-click redirections, and instant contract deletion.

4. **Database Management & Workspace Features:**
   > *"add a clean db kinda button and health should have a page and type should use our dropdown not system normal dropdown"*
   > *"add bulk delete in home page in Contracts Workspace"*
   > *"when bulk delete is clicked it. should come or else normal near clean db"*
   > *"add toast messages for everything"*
   - Implementation of administrative database reset, `/health` dashboard, batch multi-contract deletion, and universal toast notifications.

5. **Chart Polishing & Interaction Fixes:**
   > *"improvise dashboard-> when clicked something a blue line comes it needs to me improvised"*
   > *"fix the blue line when clicked in charts and bar graph when clicked on it when hovered stats should show"*
   > *"run pnpm start check for errors"*
   - Deep inspection and resolution of Recharts accessibility focus rings, tooltip cursors, and production build validation.

---

## 3. Delegated Work

The user delegated end-to-end full-stack engineering responsibilities across all 8 phases:

1. **Database Schema & Migrations:**
   - Designed PostgreSQL schema with Drizzle ORM (`contracts`, `contract_versions`, `findings`).
   - Implemented foreign key cascades for clean contract deletion and bulk deletion.
   - Built zero-AI SQL aggregate queries for real-time dashboard analytics.

2. **Document Ingestion & Text Parsing:**
   - Integrated deterministic parsers: `unpdf`, `mammoth` (DOCX), and structured plain text.
   - Character and paragraph offset mapping for verbatim evidence pinpoints.

3. **Single-Call AI Pipeline & Guardrails:**
   - Designed strict 1-call prompt with JSON schema enforcement.
   - Temperature `0.1` and timeout/truncation guardrails.
   - OpenRouter provider adapter with fallback to Cohere and Llama free models.

4. **DocuSign Review Studio UI:**
   - Permanent light theme with DocuSign blue `#005CB9`.
   - Dual-pane independent scrolling (document canvas on left, findings drawer on right).
   - "Locate in Doc" bidirectional highlighting and human-correction workflows.

5. **Deterministic Date Arithmetic:**
   - Exact calendar and business day math using `date-fns`.
   - Notice periods, month-end rollovers, and automated alert schedule calculations.

6. **Version Diff & Stale Approval Engine:**
   - Token-level Jaccard similarity and quote diff engine.
   - Automatic carry-forward of approvals for unchanged clauses and `potentially_stale` tagging for altered clauses.

7. **Security, Health & Administrative Features:**
   - Regex-based API key sanitization in logs.
   - Dedicated `/health` page and `/api/health` endpoint.
   - "Clean DB" reset and bulk contract deletion.
   - Universal toast feedback system.

---

## 4. Important Agent Mistakes & Rejected Suggestions

During the iterative process, several subtle bugs, edge cases, and design challenges were encountered and corrected:

### Mistake 1: Client/Server Hydration Mismatch on Date Formatting
- **Issue:** Using `new Date(c.createdAt).toLocaleDateString()` rendered `10/11/2026` on the server (Node runtime UTC) and `11/10/2026` in the user's browser, triggering React SSR hydration warnings in the console.
- **Fix:** Wrapped dynamic date displays in `<span suppressHydrationWarning>` in `ContractListCard.tsx` and `FindingCard.tsx` to ensure safe, warning-free rendering across all user locales.

### Mistake 2: Unwanted Blue Focus Ring Around Recharts Bar Charts
- **Issue:** In Recharts v3, `<BarChart>` and `<PieChart>` enable `accessibilityLayer: true` by default. This injects `tabIndex="0"` into SVG `<g>` elements. When clicking a bar, Chrome/Safari focused the SVG layer, drawing an unsightly blue rounded outline around the entire bar container.
- **Rejected Quick-Fix:** Merely adding `outline-none` on outer container `<div>` elements failed because browser focus rings were being drawn directly by the browser's User Agent stylesheet on the inner SVG `<g>` elements.
- **Final Resolution:** 
  1. Explicitly passed `accessibilityLayer={false}` to all `<BarChart>` and `<PieChart>` components to strip `tabIndex="0"` from the root surface.
  2. Passed `cursor={false}` to `<Tooltip />` and added `.recharts-tooltip-cursor { display: none !important; }` to eliminate sticky grey cursor rectangles.
  3. Added deep CSS selectors in `globals.css` targeting `.recharts-wrapper *` and `svg *` with `outline: none !important; box-shadow: none !important;`.

### Mistake 3: Harsh Blue Focus Ring on Dropdown Trigger Buttons
- **Issue:** The reusable `<Dropdown>` component had `focus:ring-2 focus:ring-[#005CB9]`. When clicked with a mouse, the button remained focused, showing a harsh blue box.
- **Fix:** Switched to `outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005CB9]`. Mouse clicks produce no outline, while keyboard `Tab` navigation preserves accessibility focus.

### Mistake 4: Database Foreign Key Cascade During Contract Deletion
- **Issue:** Deleting a contract initially failed with PostgreSQL foreign key constraint errors because child `contract_versions` and grandchild `findings` records were not cascaded.
- **Fix:** Updated the schema with `onDelete: "cascade"` and implemented cascading deletion queries that clean up all child versions and findings in a single atomic transaction.

### Rejected Approach: Multi-Turn AI Chatbot on Contract Review
- **Rejected Proposal:** An early temptation was to add an interactive AI chat drawer allowing reviewers to ask follow-up questions.
- **Reason for Rejection:** Violated the **Strict 1-Call AI Budget** rule. Chat interfaces consume unpredictable API quotas, introduce latency, and hallucinate interpretations. Instead, all filtering, searches, and summaries were implemented 100% deterministically in TypeScript and SQL at 0 AI cost.

---

## 5. Output Verification Protocol

Every phase and feature was verified through a comprehensive multi-tier testing pipeline:

1. **Automated Unit & Integration Testing (`pnpm test`):**
   - 10 test suites in `tests/` covering database operations, deterministic parsers, AI budget isolation, evidence locators, date math, version diffs, security sanitization, and cascading deletes.
   - **Result:** 56 out of 56 tests passing.

2. **Static Type Checking (`pnpm typecheck`):**
   - Executed `tsc --noEmit` across all App Router routes, components, and server actions.
   - **Result:** 0 TypeScript compiler errors.

3. **Linter Verification (`pnpm lint`):**
   - Executed ESLint with Next.js core web vitals and React rules.
   - **Result:** 0 lint errors, 0 warnings.

4. **Production Build Compilation (`pnpm build`):**
   - Compiled production bundle using Turbopack (`next build`).
   - Verified that all 18 routes (14 dynamic server routes, 4 static routes) compiled and optimized cleanly.

5. **Live Server Execution (`pnpm start`):**
   - Booted production server on `http://localhost:3000`.
   - Verified HTTP 200 OK responses on `GET /`, `GET /health`, `GET /api/health`, and contract dashboard routes.
   - Checked server logs to ensure zero uncaught exceptions and clean request handling.

6. **Deployment to Production:**
   - Pushed all commits to `origin main`.
   - Verified production build and live availability on Vercel (`https://contractlens-4iv9.vercel.app/`).
