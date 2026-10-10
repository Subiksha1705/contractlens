import React from "react";
import { AlertCircle } from "lucide-react";

interface DisclaimerProps {
  compact?: boolean;
}

export function Disclaimer({ compact = false }: DisclaimerProps) {
  if (compact) {
    return (
      <p className="text-xs text-neutral-500">
        ContractLens is an information-management tool, not legal advice. Human review is strictly required.
      </p>
    );
  }

  return (
    <aside aria-label="Legal disclaimer" className="w-full border-t border-neutral-200 bg-neutral-50/70 py-4 px-6 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <strong>Legal Disclaimer:</strong> ContractLens is an automated information-management tool designed for review workflows and does not provide legal advice or recommendations. All extractions and calculated dates must be verified by qualified personnel.
          </span>
        </div>
        <div className="shrink-0 font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
          ContractLens &bull; Evidence-First Contract Intelligence
        </div>
      </div>
    </aside>
  );
}
