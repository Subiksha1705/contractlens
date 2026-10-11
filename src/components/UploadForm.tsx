"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface ParseResponse {
  success: boolean;
  contractId?: string;
  kind?: string;
  fileName?: string | null;
  charCount?: number;
  pageCount?: number | null;
  previewText?: string;
  error?: string;
}

interface UploadFormProps {
  endpoint?: string;
  redirectOnSuccess?: boolean;
}

export function UploadForm({
  endpoint = "/api/contracts",
  redirectOnSuccess = false,
}: UploadFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [policyText, setPolicyText] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        const msg = `File size (${(selected.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB limit.`;
        setError(msg);
        toast.error("File Too Large", msg);
        setFile(null);
        e.target.value = "";
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
      toast.info("Document Selected", `${selected.name} (${(selected.size / 1024).toFixed(1)} KB)`);
    }
  };

  const handleLoadSample = (v: "v1" | "v2") => {
    setMode("paste");
    setError(null);
    setResult(null);
    toast.info("Sample Contract Loaded", `Loaded synthetic contract template (${v.toUpperCase()}).`);
    if (v === "v1") {
      setText(`MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is made and entered into as of January 1, 2025 (the "Effective Date"), by and between Acme Global Inc. ("Client"), a Delaware corporation, and Nexus Logic Systems LLC ("Provider"), a California limited liability company.

1. TERM AND DURATION
1.1 Initial Term. This Agreement shall commence on the Effective Date and shall remain in effect for an initial term of one (1) year, expiring on December 31, 2025 ("Initial Term").
1.2 Automatic Renewal. Following the Initial Term, this Agreement shall automatically renew for successive terms of one (1) year each, unless either party provides written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term.

2. TERMINATION
2.1 Termination for Convenience. Either party may terminate this Agreement without cause upon thirty (30) days prior written notice to the other party.
2.2 Termination for Cause. Either party may terminate immediately upon written notice if the other party breaches any material term and fails to cure such breach within thirty (30) days of receipt of notice.

3. FEES AND PAYMENT TERMS
3.1 Invoices and Due Dates. Provider shall invoice Client monthly for services rendered. Client shall pay all undisputed invoice amounts within thirty (30) days of the invoice date.

4. SERVICE LEVELS AND AMBIGUOUS NOTICES
4.1 System Maintenance. Provider shall use commercially reasonable efforts to maintain 99.9% system availability. Provider may schedule temporary maintenance periods upon providing reasonable notice to Client.

5. GENERAL PROVISIONS AND NOTICES
5.1 Legal Notices. All formal legal notices under Section 5 must be delivered in writing via registered mail with forty-five (45) days advance notification to the designated corporate representatives.`);
    } else {
      setText(`MASTER SERVICES AGREEMENT (AMENDED V2)

This Master Services Agreement ("Agreement") is made and entered into as of January 1, 2025 (the "Effective Date"), by and between Acme Global Inc. ("Client"), a Delaware corporation, and Nexus Logic Systems LLC ("Provider"), a California limited liability company.

1. TERM AND DURATION
1.1 Initial Term. This Agreement shall commence on the Effective Date and shall remain in effect for an initial term of one (1) year, expiring on December 31, 2025 ("Initial Term").
1.2 Automatic Renewal. Following the Initial Term, this Agreement shall automatically renew for successive terms of one (1) year each, unless either party provides written notice of non-renewal at least ninety (90) days prior to the expiration of the then-current term.

2. DATA PRIVACY AND SECURITY (NEW OBLIGATION)
2.1 Data Deletion Obligation. Upon expiration or termination of this Agreement, Provider must securely delete all Client confidential data within fourteen (14) days and provide a written certificate of destruction.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res: Response;
      if (mode === "file") {
        if (!file) {
          throw new Error("Please select a file to parse.");
        }
        const data = new FormData();
        data.append("file", file);
        if (title.trim()) data.append("title", title.trim());
        if (policyText.trim()) data.append("policyText", policyText.trim());
        res = await fetch(endpoint, {
          method: "POST",
          body: data,
        });
      } else {
        if (!text.trim()) {
          throw new Error("Please paste contract text.");
        }
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            title: title.trim() || undefined,
            policyText: policyText.trim() || undefined,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to process document.");
      }

      if (redirectOnSuccess && json.contractId) {
        toast.success("Extraction Complete", "Contract obligations extracted! Opening Review Studio...");
        router.push(`/contracts/${json.contractId}`);
        return;
      }

      toast.success("Document Ingested", "Deterministic text and boundary analysis completed.");
      setResult(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error("Extraction Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Document Ingestion</h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload PDF, DOCX, or paste text. Pure deterministic parsing with zero AI usage.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample("v1")}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
          >
            Load Sample v1
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample("v2")}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
          >
            Load Sample v2
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-3 my-6">
        <button
          type="button"
          onClick={() => {
            setMode("file");
            setError(null);
            setResult(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition ${
            mode === "file"
              ? "bg-[#005CB9] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Upload File (PDF / DOCX / TXT)
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("paste");
            setError(null);
            setResult(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition ${
            mode === "paste"
              ? "bg-[#005CB9] text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Paste Plain Text
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Contract Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master Services Agreement 2025"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        {mode === "file" ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Contract Document
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-8 text-center transition cursor-pointer relative bg-slate-50/50">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              {file ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB &bull; Click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Drop your contract here or click to browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF (serverless page parsing), DOCX, and TXT up to 5 MB
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contract Text
            </label>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full text of your agreement here..."
              className="w-full rounded-xl border border-slate-200 p-4 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/30"
            />
          </div>
        )}

        {/* Optional Policy Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowPolicy(!showPolicy)}
            className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
          >
            {showPolicy ? "− Remove optional policy" : "+ Add optional corporate policy document"}
          </button>
          {showPolicy && (
            <div className="mt-3">
              <textarea
                rows={4}
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                placeholder="Paste corporate policy text to check for mismatches..."
                className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/30"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Document Rejection</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Document Parsed Successfully (Deterministic / 0 AI Calls)
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-white/70 rounded border border-emerald-100">
                Kind: <span className="font-semibold">{result.kind}</span>
              </div>
              <div className="p-2 bg-white/70 rounded border border-emerald-100">
                Characters: <span className="font-semibold">{result.charCount}</span>
              </div>
              {result.pageCount !== null && (
                <div className="p-2 bg-white/70 rounded border border-emerald-100 col-span-2">
                  Total Pages Detected: <span className="font-semibold">{result.pageCount}</span>
                </div>
              )}
            </div>
            {result.previewText && (
              <div className="mt-3 p-3 bg-white/90 rounded border border-emerald-100 font-mono text-[11px] max-h-36 overflow-y-auto whitespace-pre-wrap text-slate-700">
                {result.previewText}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (mode === "file" && !file) || (mode === "paste" && !text.trim())}
          className="w-full py-3 px-5 rounded-xl bg-[#005CB9] hover:bg-[#004890] text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Extracting Contract Obligations...
            </>
          ) : redirectOnSuccess ? (
            <>
              <FileText className="w-4 h-4" /> Extract Contract (1 AI Call)
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" /> Parse Document (Deterministic)
            </>
          )}
        </button>
      </form>
    </div>
  );
}

