# ContractLens — Comprehensive UI Manual Testing Guide 📋🧪

This manual testing guide is designed for **any reviewer, tester, or stakeholder** to test **ContractLens end-to-end entirely through the user interface**. No programming knowledge, terminal commands, or scripts are required.

---

## 🧭 Pre-Test Information & Environment

- **Live Hosted Application URL:** [https://contractlens-4iv9.vercel.app/](https://contractlens-4iv9.vercel.app/)
- **Local Dev Server URL (if testing locally):** [http://localhost:3000/](http://localhost:3000/)
- **Authentication:** None required by design (public demo workspace).
- **Test Samples Provided:** Built directly into the UI via 1-click demo buttons on `/contracts/new`, or plain text files in the `samples/` folder.

---

## 📑 Test Suite Matrix

| Test Suite | Area / Feature | PRD Phase |
|---|---|:---:|
| **Test 1** | System Health & Database Diagnostics | Phase 1 & 8 |
| **Test 2** | Contract Ingestion & Input Validation | Phase 2 & 3 |
| **Test 3** | Single-Call AI Extraction & Verbatim Evidence Verification | Phase 3 |
| **Test 4** | DocuSign Review Studio & Dual-Pane Scrolling | Phase 4 |
| **Test 5** | Human Review Actions (Approve, Reject, Edit, Unverified Safety Modal) | Phase 4 |
| **Test 6** | Mathematical Deadlines & Alert Schedules (Zero-AI Arithmetic) | Phase 5 |
| **Test 7** | Multi-Version Diff & Stale Approval Carry-Forward (v1 &rarr; v2) | Phase 6 |
| **Test 8** | Printable Reviewed Summary & PDF Export | Phase 7 |
| **Test 9** | Deterministic SQL Analytics Dashboard & 1-Click Drilldowns | Phase 7 |
| **Test 10** | Contracts Workspace Management (Bulk Delete & Clean DB) | Phase 8 |
| **Test 11** | Error Boundaries, Empty States & Feedback Toasts | Phase 8 |

---

## 🧪 Test 1: System Health & Database Diagnostics

### Why We Are Testing This
ContractLens relies on Neon PostgreSQL for persistent contract storage, versioning, audit logging, and SQL analytics. Reviewers must be able to verify that the database connection is healthy and responsive without looking at server logs.

### Step-by-Step UI Instructions
1. Open your browser and navigate to `/health` (e.g., `https://contractlens-4iv9.vercel.app/health`).
2. Observe the initial state: a live health check runs automatically upon page load.
3. Click the **"Run Health Check"** button.

### Expected Outcome
- A green badge **"System Operational"** appears.
- The latency is displayed (e.g., `120ms` or similar).
- Database status displays **"Connected"** with a green checkmark.
- Timestamp reflects the current UTC time.
- A toast notification confirms: *"Database connection is healthy"*.

---

## 🧪 Test 2: Contract Ingestion & Input Validation

### Why We Are Testing This
Contracts arrive in multiple formats (PDF, DOCX, plain text). The application must cleanly accept valid files, reject oversized or unparseable files with user-friendly error banners, and prevent silent data loss.

### Step-by-Step UI Instructions

#### 2.1 Testing 1-Click Sample Ingestion (Happy Path)
1. Navigate to `/contracts/new` or click **"New Contract"** from the top navigation.
2. In the **Contract Title** field, observe the auto-placeholder or type `Master Services Agreement 2026`.
3. Click the **"Paste Plain Text"** tab.
4. Click the blue sample shortcut button labeled **"Agreement v1"**.
5. Observe that the text area is immediately populated with a complete synthetic contract containing parties, dates, renewal terms, termination clauses, notice periods, and ambiguities.

#### 2.2 Testing Input Guards & Validations (Edge Cases)
1. **Empty Submission:** Clear the text area completely and click **"Extract Contract (1 AI Call)"**.
   - *Expected:* An alert banner or toast informs you: *"Please provide contract text or upload a document"*. The form is not submitted.
2. **Unsupported File Type:** Click the **"Upload File"** tab. Attempt to drag & drop or select an image file (`.png`, `.jpg`) or executable.
   - *Expected:* The file input only accepts `.pdf`, `.docx`, `.txt`. If bypassed, an error banner states: *"Unsupported file format"*.
3. **Character Truncation Notice (> 60,000 Chars):** If text exceeds 60,000 characters, ContractLens truncates at a clean paragraph boundary and displays a visible yellow alert: *"Document Truncated: Input exceeded character limit and was truncated safely at a paragraph boundary."*

---

## 🧪 Test 3: Single-Call AI Extraction & Verbatim Evidence Verification

### Why We Are Testing This
This is the core USP of ContractLens: **"One-hit contract intelligence"**. Exactly **one** structured AI call is made during upload. The system must extract parties, dates, renewal clauses, termination clauses, obligations, conflicts, and ambiguities, then **deterministically verify** that each quote exists character-for-character in the original document.

### Step-by-Step UI Instructions
1. On `/contracts/new`, click **"Agreement v1"** under the "Paste Plain Text" tab.
2. Click the primary button: **"Extract Contract (1 AI Call)"**.
3. Observe the loading overlay: an animated spinner with step progression messages (*"Reading document structure..."*, *"Executing structured AI extraction..."*, *"Verifying verbatim quotes..."*).
4. Once completed, you are automatically redirected to the **DocuSign Review Studio** (`/contracts/[id]`).

### Expected Outcome
- The page loads the contract review workspace.
- A green badge indicates the AI model used (e.g., `OPENROUTER` or `MOCK`).
- Findings are displayed in the right drawer with:
  - **Clause Type Badge:** (`PARTY`, `EFFECTIVE_DATE`, `RENEWAL`, `TERMINATION`, `NOTICE`, `OBLIGATION`, `AMBIGUITY`).
  - **Verbatim Quote:** The exact quote from the document is shown inside quotation marks.
  - **Evidence Badge:** Verified quotes show a green **"Verified Quote"** badge.
  - **Certainty Badge:** High-certainty items show **"Confirmed"**; unclear or vague items show **"Uncertain"** (in amber/rose).
  - **Clarification Question:** Unclear clauses show an AI-suggested question to ask the counterparty.

---

## 🧪 Test 4: DocuSign Review Studio & Dual-Pane Scrolling

### Why We Are Testing This
Legal reviewers must review dense documents without experiencing full-page scroll fatigue. The interface must resemble DocuSign's clean, permanent light theme with two independent scrolling panes.

### Step-by-Step UI Instructions
1. In the Review Studio (`/contracts/[id]`), observe the two main panes:
   - **Left Pane:** Paper Document Canvas showing the full contract text.
   - **Right Pane:** Review Findings Drawer displaying clause cards.
2. Hover your mouse over the **Left Pane** and scroll down.
   - *Expected:* Only the document canvas scrolls. The toolbar and right findings drawer remain stationary.
3. Hover your mouse over the **Right Pane** and scroll down.
   - *Expected:* Only the review findings drawer scrolls. The document canvas remains stationary.
4. Test the **Document Toolbar (Left Pane)**:
   - Click the **Zoom In (`+`)** and **Zoom Out (`-`)** buttons. Notice text size scales smoothly.
   - Click the **Search Input**, type `notice`, and press Enter. Notice search results count and highlighted matches in the document.
5. Test the **Pane Layout Controls (Top Right)**:
   - Click the **Split View Icon** (default): 50/50 dual pane.
   - Click the **Document Only Icon**: document expands to 100% width.
   - Click the **Findings Only Icon**: findings drawer expands to 100% width.

---

## 🧪 Test 5: Human Review Actions & Verification Safety Modal

### Why We Are Testing This
The AI never makes final legal decisions. The human reviewer must approve, reject, or correct findings. Furthermore, **approving an unverified quote must trigger a confirmation safety modal** to prevent accidental approval of hallucinated clauses.

### Step-by-Step UI Instructions

#### 5.1 Bidirectional Evidence Linking ("Locate in Doc")
1. In the findings drawer on the right, find any clause card (e.g., the *Auto-Renewal* or *Notice* clause).
2. Click the **"Locate in Doc"** button on the card.
3. **Expected Outcome:** The left document canvas instantly scrolls smoothly to that exact paragraph, and highlights the verbatim quote with a prominent yellow evidence marker (`.highlight-evidence`). A subtle indicator shows *"Viewing in document"*.

#### 5.2 Approving a Verified Finding
1. On any verified clause card, click the green **"Approve"** button.
2. **Expected Outcome:**
   - Status badge transitions from `PENDING` to a green `APPROVED` badge with a checkmark.
   - The top review progress bar updates immediately (e.g., `1/10 (10%)`).
   - A success toast notification appears: *"Finding approved"*.
   - The timestamp displays: *"Reviewed: MM/DD/YYYY"*.

#### 5.3 Editing a Finding (Preserving Immutable AI Values)
1. On any card, click the **"Edit"** button.
2. An inline form opens showing:
   - Value input
   - Responsible Party input
   - Deadline Date picker
3. Modify the value (e.g., change `60 days notice` to `90 days notice`).
4. Click **"Save Corrections"**.
5. **Expected Outcome:**
   - A purple badge **"User-corrected"** appears on the card.
   - The display value updates to your corrected text.
   - The original AI-extracted value remains preserved underneath (*"Original AI extraction: 60 days..."*).
   - Click **"Reset to AI value"** &rarr; the card cleanly reverts back to the original AI value.

#### 5.4 Rejecting a Finding
1. On any card, click the red **"Reject"** button.
2. **Expected Outcome:**
   - The card status turns to red `REJECTED`.
   - The finding is marked rejected without being deleted from the audit trail.
   - A toast notification confirms: *"Finding marked as rejected"*.

#### 5.5 Unverified Confirmation Safety Modal
1. Filter or locate a card with an amber/red **"Unverified Quote"** badge (or an *Uncertain* clause).
2. Click **"Approve"**.
3. **Expected Outcome:**
   - The system **blocks immediate approval**.
   - A modal dialog appears: *"⚠️ Confirm Approval of Unverified Clause: This clause could not be verified verbatim against the document text. Are you sure you want to approve it?"*
   - Clicking **"Cancel"** dismisses the modal without approving.
   - Clicking **"Confirm Approval"** records the human override with an explicit audit note.

---

## 🧪 Test 6: Mathematical Deadlines & Alert Schedules

### Why We Are Testing This
AI models frequently hallucinate calendar math (e.g., calculating 60 days before March 31 incorrectly, failing leap years, or missing month-end rollovers). ContractLens calculates deadlines **deterministically in TypeScript using `date-fns` at zero AI cost**.

### Step-by-Step UI Instructions
1. In the Review Studio toolbar, switch from the **"Clauses"** tab to the **"Deadlines"** tab.
2. Review the list of extracted deadlines.
3. Locate the **Non-Renewal Notice Deadline**:
   - Check the **Calculated Date** (e.g., `Nov 1, 2025` or `Oct 31, 2025`).
   - Inspect the **Calculation Basis Badge**: It displays exact mathematical reasoning (e.g., *"Dec 31, 2025 minus 60 calendar days (assumed calendar days)"*).
   - Notice that the AI **did not guess** the date; it supplied the formula and code calculated the calendar math.
4. Locate vague clauses (e.g., *"Reasonable notice prior to termination"*):
   - Notice the date is empty and tagged with a purple badge: **"Needs Human Date"**.
5. Inspect the **Reminder Schedule**:
   - For dated obligations, observe the planned alerts: `30 days before`, `14 days before`, `7 days before`, `1 day before`.
6. Click **"View in Document"** next to any deadline &rarr; the left document pane scrolls directly to the source clause.

---

## 🧪 Test 7: Multi-Version Diff & Stale Approval Carry-Forward (v1 &rarr; v2)

### Why We Are Testing This
When an amendment or version 2 of an agreement is signed, reviewers should not start from scratch. Unchanged clauses must keep their existing human approvals, while modified clauses must be flagged **"Potentially Stale"** with side-by-side diff reasons.

### Step-by-Step UI Instructions
1. Make sure you have approved at least 2 clauses in your v1 contract from Test 5.
2. In the top navigation bar, click the **"v1"** dropdown or click **"Switch Contract"** / **"Back to Review Studio"**.
3. Navigate to version history or open `/contracts/[id]/versions`.
4. In the **Upload New Version (v2)** section:
   - Select **"Paste Text"**.
   - Click the button **"Agreement v2 (Amendment)"** (this sample amends the notice period from 60 to 90 days and adds a data-deletion clause).
   - Click **"Upload & Compare Version"**.
5. Once extraction completes, you are taken to Version 2.

### Expected Outcome
- **Stale Alert Banner:** At the top of the Review Studio, a prominent amber banner warns:
  *`⚠️ 1 Previously Approved Clause May Be Outdated — Review Version Diffs`*.
- **Carry-Forward of Approvals:** Clauses that did NOT change between v1 and v2 carry forward their `APPROVED` badge automatically with a note: *"Carried over from v1"*.
- **Stale Flagging:** The Notice clause is flagged with an amber **"Potentially Stale"** badge.
- **Diff Explanation:** The card explicitly shows:
  *`Version Diff: Value changed in version 2 (was: "60 calendar days", now: "90 calendar days")`*.
- Reviewer can inspect the change and click **"Approve Updated Version"** or edit it.

---

## 🧪 Test 8: Printable Reviewed Summary & PDF Export

### Why We Are Testing This
Legal teams, executives, and counterparties need a clean, structured executive summary that can be printed or saved to PDF at zero AI cost.

### Step-by-Step UI Instructions
1. From the top navigation in Review Studio, click the green button: **"Printable Summary"** (or navigate to `/contracts/[id]/summary`).
2. Observe the document layout formatted like a formal executive legal memorandum:
   - **Section 1: Parties & Key Dates:** Contracting entities, roles, and effective date.
   - **Section 2: Term, Renewal & Termination:** Renewal terms and notice windows.
   - **Section 3: Obligations & Deadlines:** Chronological obligations with mathematical calculation basis.
   - **Section 4: Attention Required:** Clearly separated section highlighting pending clauses, uncertain items, and version stale diffs with clarification questions.
   - **Section 5: Rejected Clauses:** Summary count of rejected provisions.
   - **Legal Disclaimer:** Mandatory information-management disclaimer at the bottom.
3. Click the blue button: **"Print / Save as PDF"** at the top right.
4. **Expected Outcome:** The browser's native print preview dialog opens. Notice that the page layout strips UI controls, backgrounds are clean white, and typography is crisp and ready to save as a PDF.

---

## 🧪 Test 9: Deterministic SQL Analytics Dashboard & 1-Click Drilldowns

### Why We Are Testing This
Dashboards must provide instant executive oversight of contract obligations without costing AI tokens. When clicking chart bars or metric cards, the UI must smoothly navigate to the review studio filtered to those exact clauses without focus-ring glitches.

### Step-by-Step UI Instructions
1. From the top navigation, click the blue button: **"Dashboard"** (or navigate to `/contracts/[id]/dashboard`).
2. Observe the **100% Deterministic (0 AI Cost)** badge. All metrics are computed via native PostgreSQL aggregates.
3. Inspect the **Stat Cards Row**:
   - Total Clauses
   - Approved Count
   - Pending Count
   - Potentially Stale Count
   - Uncertain / Unverified Count
4. **Test 1-Click Drilldown Redirection:**
   - Click on the **"Pending"** card &rarr; You are immediately redirected to the Review Studio with `?status=pending`. Only pending clauses are shown!
   - Navigate back to the Dashboard.
   - Click on the **"Potentially Stale"** card &rarr; You are redirected to Review Studio with `?status=potentially_stale`. Only stale clauses are shown!
   - Click on the **"Uncertain / Unverified"** card &rarr; You are redirected with `?certainty=uncertain`.
5. Test the **Visual Charts**:
   - **Review Status Breakdown (Donut Chart):** Hover over the donut segments &rarr; A clean white popover card displays the exact count.
   - **Clause Types Distribution (Horizontal Bar Chart):** Hover over any bar &rarr; Popover card displays item count.
   - **Upcoming Obligations Time Horizon (Bar Chart):** Hover over time window buckets (`Overdue`, `≤ 7 Days`, `≤ 30 Days`, `≤ 90 Days`, `> 90 Days`, `Needs Human Date`) &rarr; Stats display cleanly.
6. **Verify No Blue Line on Click:**
   - Click directly on any bar in the bar chart.
   - Click directly on any slice in the donut chart.
   - **Expected Outcome:** No blue rounded outline or border appears around the charts! Hover tooltips remain responsive and fluid.
7. Test the **Switch Contract & Switch Version Dropdowns**:
   - Click **"Switch Contract"** in the top bar &rarr; Select another contract from the menu. You instantly navigate to its dashboard without page reload.
   - Click **"v1 / v2"** version dropdown &rarr; Switch between versions instantly.

---

## 🧪 Test 10: Contracts Workspace Management (Bulk Delete & Clean DB)

### Why We Are Testing This
Users must be able to manage their workspace efficiently with minimal clicks: search contracts, delete individual contracts, batch delete multiple contracts, or perform an administrative reset without leaving orphaned database records.

### Step-by-Step UI Instructions

#### 10.1 Live Search & Internal Scrolling
1. Navigate to the Home page `/` (Contracts Workspace).
2. Type a contract title into the **"Search contracts..."** box.
3. **Expected Outcome:** The contract list filters instantly in real-time as you type.
4. When multiple contracts exist, scroll the list &rarr; The card features independent internal scrolling with a sleek scrollbar without whole-page scroll runaway.

#### 10.2 Single Contract Deletion
1. On any contract row in the list, click the trash can icon (**"Delete"**).
2. A confirmation modal asks: *"Are you sure you want to delete this contract? This action will permanently remove all associated versions and findings."*
3. Click **"Delete Contract"**.
4. **Expected Outcome:** The contract is deleted with full PostgreSQL cascade cleanup. A toast confirms: *"Contract deleted successfully"*.

#### 10.3 Bulk Delete Mode
1. Next to the Clean DB button in the header, click the button: **"Bulk Delete"**.
2. **Expected Outcome:** The workspace enters Bulk Delete mode:
   - Checkboxes appear beside each contract.
   - A **"Select All"** checkbox appears.
   - The button transitions to an active red state: **"Delete Selected (0)"**.
3. Select 2 or more contracts (or click "Select All").
4. Click **"Delete Selected (N)"**.
5. Confirm in the dialog.
6. **Expected Outcome:** All selected contracts and their versions/findings are atomically cascade deleted. A toast notification confirms: *"Successfully deleted N contracts"*.

#### 10.4 Clean Database Reset ("Clean DB")
1. Click the **"Clean DB"** button in the top right of the Contracts Workspace.
2. A modal dialog appears: *"⚠️ Reset ContractLens Database: This will delete all uploaded contracts, versions, findings, and audit events. Are you sure you want to proceed?"*
3. Click **"Confirm Clean DB"**.
4. **Expected Outcome:** The database is wiped clean in an atomic transaction. The workspace shows the clean empty state: *"No contracts uploaded yet. Upload your first contract to get started."*

---

## 🧪 Test 11: Error Boundaries, Empty States & Feedback Toasts

### Why We Are Testing This
A production-grade application must never show raw uncaught error screens or silent failures. Every action must provide clear visual feedback.

### Step-by-Step UI Instructions
1. **Empty State Check:** After running Clean DB (or on a brand-new workspace), navigate to `/` &rarr; observe friendly empty state with an **"Upload Contract"** call-to-action button.
2. **Toast Feedback:** Perform any action (create contract, approve clause, save edit, delete contract) &rarr; notice the clean DocuSign-styled toast pop up in the corner with clear status, auto-dismissing after 3 seconds.
3. **Invalid Route Handling:** Navigate to a non-existent URL (e.g., `/contracts/invalid-uuid-12345`) &rarr; observe the clean, branded **404 Not Found** page with a *"Return to Workspace"* button.

---

## 📝 Tester Feedback & Defect Reporting Sheet

When testing, record any observations using this template:

```markdown
### Bug / Feedback Item
- **Test ID:** (e.g., Test 4.1, Test 9.6)
- **Feature Name:** 
- **Steps to Reproduce:**
- **Observed Behavior:**
- **Expected Behavior:**
- **Severity / Priority:** (Low / Medium / High / Blocker)
```
