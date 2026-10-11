import React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle, HelpCircle, ArrowUpRight } from "lucide-react";

interface StatCardsProps {
  totalFindings: number;
  approvedCount: number;
  pendingCount: number;
  staleCount: number;
  uncertainCount: number;
  unverifiedCount: number;
  totalVersions: number;
  contractId?: string;
  versionId?: string;
}

export function StatCards({
  totalFindings,
  approvedCount,
  pendingCount,
  staleCount,
  uncertainCount,
  unverifiedCount,
  totalVersions,
  contractId,
  versionId,
}: StatCardsProps) {
  const approvedPct = totalFindings > 0 ? Math.round((approvedCount / totalFindings) * 100) : 0;

  const getHref = (params?: { status?: string; certainty?: string }) => {
    if (!contractId) return null;
    const search = new URLSearchParams();
    if (versionId) search.set("versionId", versionId);
    if (params?.status) search.set("status", params.status);
    if (params?.certainty) search.set("certainty", params.certainty);
    const query = search.toString();
    return `/contracts/${contractId}${query ? `?${query}` : ""}`;
  };

  const renderCard = ({
    title,
    icon,
    count,
    subtitle,
    titleColor = "text-slate-500",
    countColor = "text-slate-900",
    subColor = "text-slate-400",
    href,
    badge,
    colSpan = "",
  }: {
    title: string;
    icon?: React.ReactNode;
    count: React.ReactNode;
    subtitle: React.ReactNode;
    titleColor?: string;
    countColor?: string;
    subColor?: string;
    href?: string | null;
    badge?: React.ReactNode;
    colSpan?: string;
  }) => {
    const cardContent = (
      <div
        className={`group relative p-4 bg-white rounded-2xl border border-slate-200 shadow-xs transition-all duration-200 outline-none select-none ${
          href
            ? "hover:border-[#005CB9] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            : ""
        } ${colSpan}`}
      >
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold ${titleColor} flex items-center gap-1.5`}>
            {title}
            {icon}
          </p>
          {badge}
          {href && (
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#005CB9] transition-colors" />
          )}
        </div>
        <p className={`text-2xl font-extrabold ${countColor} mt-1.5`}>{count}</p>
        <div className="flex items-center justify-between mt-1">
          <p className={`text-[11px] ${subColor}`}>{subtitle}</p>
          {href && (
            <span className="text-[10px] font-semibold text-[#005CB9] opacity-0 group-hover:opacity-100 transition-opacity">
              View &rarr;
            </span>
          )}
        </div>
      </div>
    );

    if (href) {
      return (
        <Link
          key={title}
          href={href}
          className="block outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005CB9] rounded-2xl"
        >
          {cardContent}
        </Link>
      );
    }

    return <div key={title}>{cardContent}</div>;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
      {/* Total */}
      {renderCard({
        title: "Total Clauses",
        count: totalFindings,
        subtitle: "Extracted in 1 AI call",
        badge: (
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            {totalVersions} {totalVersions === 1 ? "version" : "versions"}
          </span>
        ),
        href: getHref({ status: "all" }),
      })}

      {/* Approved */}
      {renderCard({
        title: "Approved",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        count: approvedCount,
        subtitle: `${approvedPct}% confirmed`,
        titleColor: "text-emerald-600",
        countColor: "text-emerald-700",
        subColor: "text-emerald-600 font-medium",
        href: getHref({ status: "approved" }),
      })}

      {/* Pending */}
      {renderCard({
        title: "Pending",
        icon: <Clock className="w-3.5 h-3.5 text-slate-400" />,
        count: pendingCount,
        subtitle: "Awaiting reviewer",
        titleColor: "text-slate-600",
        countColor: "text-slate-700",
        subColor: "text-slate-400",
        href: getHref({ status: "pending" }),
      })}

      {/* Stale */}
      {renderCard({
        title: "Potentially Stale",
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        count: staleCount,
        subtitle: "Version diff alerts",
        titleColor: "text-amber-600",
        countColor: "text-amber-700",
        subColor: "text-amber-600 font-medium",
        href: getHref({ status: "potentially_stale" }),
      })}

      {/* Uncertain */}
      {renderCard({
        title: "Uncertain / Unverified",
        icon: <HelpCircle className="w-3.5 h-3.5" />,
        count: (
          <>
            {uncertainCount}{" "}
            <span className="text-sm font-semibold text-slate-400">/ {unverifiedCount}</span>
          </>
        ),
        subtitle: "Requires clarification",
        titleColor: "text-rose-600",
        countColor: "text-rose-700",
        subColor: "text-rose-600 font-medium",
        href: getHref({ certainty: "uncertain" }),
        colSpan: "col-span-2 md:col-span-1",
      })}
    </div>
  );
}
