"use client";

import React from "react";
import { Printer } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function PrintButton() {
  const { toast } = useToast();

  const handlePrint = () => {
    toast.info("Preparing PDF Document", "Launching print and export dialog...");
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition print:hidden"
    >
      <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
    </button>
  );
}
