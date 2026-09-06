import { API_URL } from '@/lib/api';
import React from "react";
import { ReportsClient } from "./ReportsClient";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Reports & Decision Support | MPLADS",
  description: "Generate comprehensive analytical reports from the live MPLADS dataset.",
};

async function fetchData(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}/api/reports/${endpoint}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function fetchAuditProvenance() {
  try {
    const res = await fetch(`${API_URL}/api/audit/provenance`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function ReportsPage() {
  const [national, decisionSupport, provenance] = await Promise.all([
    fetchData("national"),
    fetchData("decision-support"),
    fetchAuditProvenance()
  ]);

  return (
    <div className="flex-1 space-y-8 print:space-y-0">
      {/* Header - Hidden during print */}
      <div className="flex flex-col gap-2 print:hidden">
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
          <FileText className="w-8 h-8" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Reporting & Decision Support
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Generate professional, data-driven analytical reports and access the prioritized review queue based on live anomaly and audit exceptions.
        </p>
      </div>

      {/* Main Client Interface */}
      <ReportsClient 
        initialNational={national} 
        initialDecisionSupport={decisionSupport} 
        provenance={provenance}
      />
    </div>
  );
}
