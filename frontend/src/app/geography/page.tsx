import { API_URL } from '@/lib/api';
import React, { Suspense } from "react";
import { GeographyClient } from "./GeographyClient";
import { Map, TrendingUp, AlertTriangle, Building, Briefcase } from "lucide-react";

export const metadata = {
  title: "Geographic Intelligence | MPLADS",
  description: "National map and geographic analytics for MPLADS",
};

async function getSummaryData() {
  const res = await fetch(`${API_URL}/api/analytics/geography/summary`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getStatesData() {
  const res = await fetch(`${API_URL}/api/analytics/geography/states`, { cache: "no-store" });
  if (!res.ok) return { data: [] };
  return res.json();
}

export default async function GeographyPage() {
  const summary = await getSummaryData();
  const statesObj = await getStatesData();
  const states = statesObj?.data || [];

  return (
    <div className="flex-1 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <Map className="w-8 h-8" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Geographic Intelligence
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-3xl">
          National-level analysis of fund utilization, project execution, and risk concentration across states and constituencies.
        </p>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground">National Expenditure</p>
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="text-3xl font-bold">
              ₹{(summary.total_expenditure / 10000000).toFixed(2)} Cr
            </h3>
            <p className="text-sm mt-2 font-medium text-emerald-600 dark:text-emerald-400">
              {summary.overall_utilization.toFixed(1)}% Utilization
            </p>
          </div>
          
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground">Highest Expenditure</p>
              <Building className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-1 truncate">{summary.highest_expenditure_state}</h3>
            <p className="text-sm text-muted-foreground">
              ₹{(summary.highest_expenditure_value / 10000000).toFixed(2)} Cr
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground">Completed Works</p>
              <Briefcase className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-bold">{summary.most_completed_works.toLocaleString()}</h3>
            <p className="text-sm mt-2 text-muted-foreground">
              Across {summary.active_states} States/UTs
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-muted-foreground">Highest Risk</p>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold mb-1 truncate">{summary.highest_risk_state}</h3>
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium mt-1">
              {summary.high_risk_mps} High Risk MPs Nationally
            </p>
          </div>
        </div>
      )}

      <GeographyClient states={states} />
    </div>
  );
}
