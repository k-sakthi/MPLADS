import { API_URL } from '@/lib/api';
import React from "react";
import { IntelligenceClient } from "./IntelligenceClient";
import { Brain, Shield, TrendingUp, AlertTriangle, BarChart3, Briefcase, Users, Zap } from "lucide-react";

export const metadata = {
  title: "Executive Intelligence | MPLADS",
  description: "AI-assisted executive intelligence dashboard for MPLADS",
};

async function fetchData(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}/api/analytics/intelligence/${endpoint}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function IntelligencePage() {
  const [summary, insights, anomalies, priorities] = await Promise.all([
    fetchData("summary"),
    fetchData("insights"),
    fetchData("anomalies"),
    fetchData("priorities"),
  ]);

  const formatRs = (val: number) => {
    const cr = val / 10000000;
    if (cr >= 100) return `₹${cr.toFixed(0)} Cr`;
    if (cr >= 1) return `₹${cr.toFixed(1)} Cr`;
    return `₹${(val / 100000).toFixed(1)} L`;
  };

  return (
    <div className="flex-1 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-violet-600 dark:text-violet-400">
          <Brain className="w-8 h-8" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Executive Intelligence
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-3xl">
          AI-assisted decision support: data-driven insights, anomaly signals, and national trend analysis powered by Isolation Forest machine learning.
        </p>
      </div>

      {/* Executive KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
          {[
            { label: "Allocated", value: formatRs(summary.total_allocated), icon: BarChart3, color: "text-indigo-500" },
            { label: "Recommended", value: formatRs(summary.total_recommended), icon: TrendingUp, color: "text-blue-500" },
            { label: "Sanctioned", value: formatRs(summary.total_sanctioned), icon: Shield, color: "text-cyan-500" },
            { label: "Expenditure", value: formatRs(summary.total_expenditure), icon: Zap, color: "text-emerald-500" },
            { label: "Completed", value: summary.total_completed.toLocaleString(), icon: Briefcase, color: "text-green-500" },
            { label: "Ongoing", value: summary.total_ongoing.toLocaleString(), icon: Briefcase, color: "text-amber-500" },
            { label: "Utilization", value: `${summary.overall_utilization}%`, icon: TrendingUp, color: "text-teal-500" },
            { label: "High Risk", value: summary.high_risk_count.toString(), icon: AlertTriangle, color: "text-rose-500" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Client interactive sections */}
      <IntelligenceClient
        insights={insights}
        anomalies={anomalies}
        priorities={priorities}
        summary={summary}
      />
    </div>
  );
}
