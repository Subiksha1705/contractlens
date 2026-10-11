# ContractLens 🔍📄

> **Evidence-First, One-Hit Contract Intelligence**  
> Turn complex agreements into traceable, reviewable, deadline-ready obligations with **exactly one AI call per upload**.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Serverless-blue.svg?style=flat-square&logo=postgresql)](https://neon.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-v0.45-green.svg?style=flat-square)](https://orm.drizzle.team/)
[![Vitest](https://img.shields.io/badge/Vitest-55_Tests_Passing-brightgreen.svg?style=flat-square&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🎯 The Core Problem & The One-Call Rule

Traditional AI contract review tools suffer from two major flaws:
1. **Hallucinations & Untraceable Summaries:** AI models state obligations without pinpoint evidence, hallucinate dates, or alter the meaning of clauses.
2. **Wasteful Token Usage & Slow Round-Trips:** Querying the model repeatedly for party extraction, dates, clauses, policy checks, ambiguities, and summaries consumes excessive API tokens, introduces latency, and blows out budgets.

### The ContractLens Solution
- **Strict 1-Call AI Budget:** Exactly **ONE** structured AI extraction is performed per contract upload.
- **0 AI Cost Everywhere Else:** Quote verification, mathematical date calculations, version diffs, approval carry-forward, printable summaries, and visual dashboards run **entirely in deterministic TypeScript code and native SQL aggregates at 0 API token cost**.
- **Evidence-First Trust Protocol:** Every finding requires a verbatim source quote. If a quote cannot be verified character-for-character against the document text, ContractLens flags it as `uncertain` and demands explicit human verification.
- **DocuSign Review Studio Experience:** Clean, permanent light theme, split dual-pane layout with independent internal scrolling, in-document search, 1-click evidence jumping, and instant contract deletion.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    User([User / Legal Reviewer]) -->|Uploads PDF, DOCX, TXT| Ingest[Upload Endpoint /api/contracts]
    Ingest --> Parsers[Deterministic Parsers: pdf-parse, mammoth, text]
    Parsers --> Boundary[Boundary Normalizer & Char Mapper]
    Boundary --> SingleAICall["Single Structured AI Call (OpenRouter / Cohere / Llama)"]
    SingleAICall --> Extracted[JSON Findings: Parties, Dates, Obligations, Conflicts, Ambiguities]
    
    subgraph Zero AICost Engine [Deterministic Zero-AI Cost Engine]
        Extracted --> EvidenceLocator[Evidence Locator: Exact Substring & Fuzzy Matcher]
        EvidenceLocator --> MathDates[date-fns Mathematical Deadline Calculator]
        MathDates --> StaleCompare[Version Diff & Token Jaccard Stale Detector]
        StaleCompare --> Postgres[(Neon PostgreSQL via Drizzle ORM)]
    end
    
    Postgres --> ReviewStudio["DocuSign Review Studio (Independent Internal Scrolling)"]
    Postgres --> PrintableSummary["Printable Summary (5 Categorized Groups & PDF Export)"]
    Postgres --> SQLDashboard["Real-Time SQL Aggregates Dashboard (Recharts Donut/Bar)"]
```

---

## 📋 Project Scope: Completed vs. Excluded

### ✅ Completed Scope
- **Phase 1 (Database Foundation):** Neon Serverless PostgreSQL with Drizzle ORM schemas (`contracts`, `contract_versions`, `findings`), relational indexes, health check endpoints, and schema push scripts.
- **Phase 2 (Ingestion & Parsing):** Deterministic multi-format extraction for PDF (`unpdf`), Word (`mammoth`), and plaintext (`.txt`) with paragraph and character boundary normalization.
- **Phase 3 (Single-Call AI Pipeline):** Strict 1-Call budget rule per contract upload. Structured extraction of parties, dates, renewal terms, notice windows, governing law, obligations, conflicts, and ambiguities via OpenRouter / Gemini.
- **Phase 4 (Zero-AI Review Studio):** DocuSign-inspired permanent light theme, split dual-pane layout with independent internal scrolling, verbatim character-level quote verification, human corrections preserving immutable AI records, and safety modals for unverified quotes.
- **Phase 5 (Mathematical Deadlines):** Exact calendar and business day calculations using `date-fns` arithmetic, notice windows, month-end rollovers, automated reminder schedules (90d, 60d, 30d, 14d, 7d), and `needs_human_date` flags for vague clauses.
- **Phase 6 (Multi-Version Diff & Stale Carry-Forward):** Version comparisons, token Jaccard similarity, automatic carry-forward of approvals for unchanged clauses, and `potentially_stale` tagging with explicit diff explanations.
- **Phase 7 (Printable Summary & Visual Dashboard):** 5-group human review memo with print/PDF export styling, real-time SQL aggregate Donut and Bar charts, 1-click drilldowns from stat cards to Review Studio, and reusable contract/version switcher dropdowns.
- **Phase 8 (Hardening, Security & Polish):** Zero exposed secrets, administrative database reset ("Clean DB"), batch multi-contract deletion with PostgreSQL cascades, dedicated `/health` page, universal toast notifications, and 56 passing Vitest automated tests.

### 🚫 Excluded Scope (Intentional Design Decisions)
- **Optical Character Recognition (OCR) for Flat Image Scans:** Scanned image-only PDFs without text layers are excluded to avoid heavy binary native dependencies (e.g., Tesseract); clean digital PDF, DOCX, and TXT formats are fully supported.
- **Autonomous Legal Execution / Auto-Signing:** The application explicitly enforces human-in-the-loop review; it never signs contracts or automatically executes binding agreements.
- **Multi-Turn Conversational Chatbots:** Excluded by design to maintain the strict 1-Call AI budget rule and prevent hallucination drift and unbounded token costs.
- **External Vector Database Embeddings:** Excluded to ensure data privacy and regulatory compliance; all storage and analytics run deterministically inside PostgreSQL.

---

## ✨ Key Features

### 1. DocuSign Review Studio
- **Dual-Pane Independent Scrolling:** Contract document canvas on the left, review cards drawer on the right. Both panes scroll independently without whole-page scroll runaway.
- **Paper Document Viewer:** Real legal contract canvas with section numbers, zoom controls, and in-document search.
- **Bidirectional Evidence Linking:** Click **"Locate in Doc"** on any finding card to automatically scroll and highlight the verbatim source clause in the contract text with a warm highlight marker.
- **Review Progress Indicator:** Live visual completion bar (`e.g., 8/12 Approved (67%)`).

### 2. Strict 1-Call AI Pipeline
- Extracts parties, effective dates, terms, renewals, notice periods, governing law, obligations, conflicts, ambiguities, and policy checks in a **single structured call**.
- Built with token exhaustion safeguards, temperature `0.1` stability, and JSON repair salvaging.
- Free-tier friendly: Configured for free OpenRouter models (`cohere/north-mini-code:free` or `meta-llama/llama-3.3-70b-instruct:free`).

### 3. Verbatim Evidence Locator
- Every AI finding is verified against the document using character-offset search.
- If the AI paraphrased or hallucinated a quote, `evidenceStatus` is forced to `unverified` and `certainty` is forced to `uncertain`.
- Approving an unverified finding requires explicit human confirmation in a safety modal.

### 4. Mathematical Deadlines (AI Never Guesses Dates)
- Computed deterministically using `date-fns` arithmetic:
  - Exact calendar days vs business days.
  - Notice windows (e.g., `effectiveDate + 1 year - 60 days`).
  - Month-end rollovers (Jan 31 + 1 month) and leap years.
  - Vague clauses (e.g., *"reasonable notice"*) are flagged `needs_human_date`.
- Automated reminder schedules (90d, 60d, 30d, 14d, 7d before deadline).

### 5. Multi-Version Diff & Stale Approval Detection
- Upload `v2` (or amendments) to an existing contract under the same 1-call budget.
- Unchanged clauses carry forward existing human approvals automatically.
- Modified clauses or shifted quotes are flagged `potentially_stale` with clear side-by-side version diff notes.
- Previous human edits are never silently overwritten.

### 6. Fast Analytics Dashboard & Reusable Dropdowns
- Aggregates review statuses, clause frequencies, and deadline horizons (Overdue, ≤7d, ≤30d, ≤90d, >90d, Needs Human Date) via native SQL.
- Reusable dropdown component enables **1-click switching between contracts and versions with zero page reloads**.
- Home page includes internal scrolling, instant live search, and 1-click contract deletion with database cascade.

### 7. Printable Reviewed Summary
- Zero-AI deterministic memo generator.
- 5 distinct grouped sections: Parties, Terms & Renewal, Obligations & Deadlines, Items Requiring Attention, and Rejection counts.
- Formatted for `@media print` with browser "Save as PDF" styling.

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js 20+
- `pnpm` (or `npm`)
- Free [Neon PostgreSQL](https://neon.tech/) database account
- Free [OpenRouter](https://openrouter.ai/) API key

### 1. Clone & Install
```bash
git clone https://github.com/Subiksha1705/contractlens.git
cd contractlens
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your Neon database connection string and OpenRouter API key:
```env
# Neon PostgreSQL pooled connection string
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require

# AI Provider: 'openrouter' | 'mock'
# (Set AI_PROVIDER=mock for local offline testing with 0 API quota)
AI_PROVIDER=openrouter

# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=cohere/north-mini-code:free

# Guardrails
MAX_INPUT_CHARS=60000
MAX_UPLOAD_MB=10
```

### 3. Push Database Schema to Neon
```bash
pnpm db:push
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deploy to Vercel (Click-by-Click)

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Navigate to [vercel.com](https://vercel.com/) and click **"Add New Project"**.
3. Import your `contractlens` GitHub repository.
4. Under **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://...` | Neon pooled connection string |
   | `AI_PROVIDER` | `openrouter` | Production AI provider |
   | `OPENROUTER_API_KEY` | `sk-or-v1-...` | Your OpenRouter API key |
   | `OPENROUTER_MODEL` | `cohere/north-mini-code:free` | Target model |
   | `MAX_INPUT_CHARS` | `60000` | Input character truncation limit |
   | `MAX_UPLOAD_MB` | `10` | Maximum file size limit |
5. Click **"Deploy"**. Vercel will build the production Next.js bundle and launch your deployment URL.
6. **Live Production Deployment:** Access the live deployment at [https://contractlens-4iv9.vercel.app/](https://contractlens-4iv9.vercel.app/) and verify database health at [https://contractlens-4iv9.vercel.app/health](https://contractlens-4iv9.vercel.app/health).

---

## 🧪 60-Second Demo & Verification Walkthrough

You can test the entire pipeline using the included synthetic sample agreements in `samples/`:

1. **Upload Contract v1:**
   - Go to [http://localhost:3000/contracts/new](http://localhost:3000/contracts/new).
   - Click **"Paste Plain Text"** and click **"Agreement v1"** (or upload `samples/synthetic-contract-v2.txt`).
   - Click **"Extract Contract (1 AI Call)"**.
2. **Review Studio & Evidence Pinpoint:**
   - You enter the DocuSign Review Studio.
   - Click **"Locate in Doc"** on the *Renewal* finding: the document on the left scrolls and highlights the 60-day notice clause in yellow.
   - Click **"Approve"** on a verified clause. Click **"Edit"** on a clause to add your human correction without altering the immutable AI record.
3. **Inspect Mathematical Deadlines:**
   - Switch to the **Deadlines** tab in the right pane.
   - Notice the notice deadline calculated to `Nov 1, 2025` with full mathematical basis (`Dec 31, 2025 - 60 days`) and next alert schedule.
4. **Upload Version 2 (Stale Detection Drill):**
   - Click **"Diff"** or navigate to version history.
   - Upload the Amended v2 sample (where notice period was amended to 90 days and a data deletion clause was added).
   - In v2, the notice period finding is automatically marked **"Potentially Stale"** with the exact diff reason visible. The unchanged approvals from v1 carried over automatically!
5. **Printable Summary & Visual Dashboard:**
   - Click **"Summary"** to view the 5-group human review memo with physical print / PDF export styling.
   - Click **"Dashboard"** to view real-time Donut charts and deadline horizon buckets computed at 0 AI cost.
   - Use the **Switch Contract** dropdown to navigate across agreements in 1 click!

---

## 🛡️ Automated Test Suite

ContractLens includes 10 comprehensive Vitest test suites covering all system layers:

```bash
# Run all tests
pnpm test

# Run type checking
pnpm typecheck

# Run linter
pnpm lint
```

| Test Suite | Purpose |
|---|---|
| [`tests/phase1.test.ts`](tests/phase1.test.ts) | Database connection, schema migrations, health check |
| [`tests/parse.test.ts`](tests/parse.test.ts) | PDF, DOCX, and TXT parsing, paragraph and boundary mapping |
| [`tests/evidence.test.ts`](tests/evidence.test.ts) | Exact substring locator, normalized whitespace matching |
| [`tests/extraction-pipeline.test.ts`](tests/extraction-pipeline.test.ts) | Strict 1-call AI budget rule, unverified quote detection, timeout handling |
| [`tests/review.test.ts`](tests/review.test.ts) | Approve/reject/edit, immutability of `ai_*` values, unverified safety modal |
| [`tests/deadlines.test.ts`](tests/deadlines.test.ts) | Calendar/business math, month-end rollovers, leap years, vague flag detection |
| [`tests/versions.test.ts`](tests/versions.test.ts) | Version diffs, token Jaccard similarity, stale flagging, approval carry-forward |
| [`tests/summary-dashboard.test.ts`](tests/summary-dashboard.test.ts) | Zero-AI summary grouping, SQL aggregates consistency |
| [`tests/security-hardening.test.ts`](tests/security-hardening.test.ts) | Secret sanitization, 10MB upload limits, path traversal protection |
| [`tests/dropdown-delete.test.ts`](tests/dropdown-delete.test.ts) | Contract deletion and PostgreSQL cascade cleanup |

---

## 🔒 Limitations & Privacy

- **No OCR:** Image-only scanned PDFs require searchable text layers. Text extraction relies on embedded text in PDF, DOCX, or TXT.
- **Statutory Holidays:** Business day math handles Monday–Friday calendar business days; local statutory bank holidays require human verification.
- **Data Privacy:** Contracts sent for extraction pass through OpenRouter to the selected open-weight model. No contract text is stored on external vector databases.
- **Responsible AI:** ContractLens assists legal and operations workflows; all code was designed with human-in-the-loop review.

---

## ⚖️ Legal Disclaimer

> **ContractLens is an automated information-management tool designed for contract review workflows and does not provide legal advice or legal recommendations.** All extractions, identified obligations, and calculated deadlines must be reviewed and verified by qualified personnel.

---

## 📄 License

MIT License. Designed and engineered for transparent, accountable contract intelligence.
