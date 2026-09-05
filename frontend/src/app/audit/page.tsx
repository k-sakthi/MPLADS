import React from "react";
import { AuditClient } from "./AuditClient";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Audit & Compliance | MPLADS",
  description: "Data quality, financial consistency, and workflow compliance intelligence",
};

async function fetchData(endpoint: string) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/audit/${endpoint}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function AuditPage() {
  const [summary, initialExceptions, provenance, trends] = await Promise.all([
    fetchData("summary"),
    fetchData("?limit=50&offset=0"),
    fetchData("provenance"),
    fetchData("trends")
  ]);

  return (
    <div className="flex-1 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Audit, Compliance & Data Quality
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Deterministic validation of data quality, financial consistency, and workflow compliance across the live MPLADS database.
        </p>
      </div>

      <AuditClient 
        initialSummary={summary} 
        initialExceptions={initialExceptions} 
        provenance={provenance}
        trends={trends}
      />
    </div>
  );
}
