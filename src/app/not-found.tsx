import React from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-[#005CB9] flex items-center justify-center mb-5 border border-blue-100 shadow-xs">
          <FileQuestion className="w-7 h-7" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          404 &bull; Not Found
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Page or Contract Not Found
        </h1>
        <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
          The contract agreement or page you are looking for does not exist, has been removed, or the link may be outdated.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#005CB9] hover:bg-[#004890] text-white text-xs font-semibold shadow-xs transition"
          >
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link
            href="/contracts/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Upload Contract
          </Link>
        </div>
      </div>
    </div>
  );
}
