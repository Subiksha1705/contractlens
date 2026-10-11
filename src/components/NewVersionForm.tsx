"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface NewVersionFormProps {
  contractId: string;
  nextVersionNumber: number;
}

export function NewVersionForm({ contractId, nextVersionNumber }: NewVersionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !text.trim()) {
      toast.warning("Missing Document", "Please select a contract file or paste updated contract text.");
      return;
    }

    setSubmitting(true);
    setError(null);
    toast.info("Analyzing Version", `Ingesting version v${nextVersionNumber} and computing diffs...`);

    try {
      let res: Response;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch(`/api/contracts/${contractId}/versions`, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch(`/api/contracts/${contractId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload new version.");
      }

      toast.success(
        "New Version Analyzed",
        `Version v${data.versionNumber || nextVersionNumber} ingested! Decisions carried forward.`
      );
      router.push(`/contracts/${contractId}?versionId=${data.versionId}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Version upload failed";
      setError(msg);
      toast.error("Upload Failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Contract File (PDF, DOCX, TXT)
        </label>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              toast.info("File Selected", `${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
            }
          }}
          disabled={submitting}
          className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Or Paste Amended Contract Text
        </label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the new version contract text here if no file is available..."
          disabled={submitting}
          className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || (!file && !text.trim())}
        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-xs transition inline-flex items-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingesting & Diffing...
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" /> Ingest & Compare Version {nextVersionNumber}
          </>
        )}
      </button>
    </form>
  );
}
