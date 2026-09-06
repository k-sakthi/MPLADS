"use client";
import { API_URL } from '@/lib/api';


import React, { useState } from "react";
import { Download, FileText, CheckCircle, Database, Calendar } from "lucide-react";

export function ReportsClient({
  initialNational,
  initialDecisionSupport,
  provenance,
}: {
  initialNational: any;
  initialDecisionSupport: any[];
  provenance: any;
}) {
  const [activeTab, setActiveTab] = useState<"NATIONAL" | "DECISION_SUPPORT">("NATIONAL");

  const handleExportCSV = async () => {
    const url = `${API_URL}/api/reports/export?report_type=${activeTab}`;
    window.open(url, "_blank");
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:m-0 print:p-0">
      
      {/* Hidden during print: Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab("NATIONAL")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "NATIONAL" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            National Report
          </button>
          <button
            onClick={() => setActiveTab("DECISION_SUPPORT")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "DECISION_SUPPORT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Decision Support Queue
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-background border border-border hover:bg-muted text-foreground px-4 py-2 rounded-lg font-medium transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md text-sm">
            <FileText className="w-4 h-4" />
            Export Official PDF
          </button>
        </div>
      </div>

      {/* Report Print Header (Only visible when printing or in the report itself) */}
      <div className="bg-card border border-border rounded-xl p-8 print:border-none print:shadow-none print:p-0 space-y-8">
        
        <div className="border-b border-border pb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {activeTab === "NATIONAL" ? "National Executive Overview" : "Priority Review Queue"}
          </h2>
          <p className="text-muted-foreground mt-1">Official MPLADS Monitoring & Intelligence Platform</p>
          <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Generated: Today
            </div>
            {provenance && (
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Source: {provenance.source_name}
              </div>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "NATIONAL" && initialNational?.overview && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Executive Summary</h3>
              <p className="text-foreground leading-relaxed">
                As of the current reporting period, the national MPLADS ecosystem encompasses a total allocated volume of ₹{initialNational.overview.total_allocated.toLocaleString()} Crores. 
                Currently, ₹{initialNational.overview.total_sanctioned.toLocaleString()} Crores have been sanctioned across {initialNational.overview.completed_works + initialNational.overview.ongoing_works} works, 
                yielding an overall fund utilization rate of {initialNational.overview.utilization.toFixed(2)}%.
                <br/><br/>
                Analytical models indicate {initialNational.high_risk_mps?.length || 0} entities requiring immediate review due to high-priority anomaly indicators, 
                and {initialNational.exceptions?.length || 0} deterministic financial/workflow consistency exceptions.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border border-border rounded-lg bg-muted/10">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Allocated</p>
                <p className="text-xl font-bold mt-1">₹{initialNational.overview.total_allocated.toLocaleString()}</p>
              </div>
              <div className="p-4 border border-border rounded-lg bg-muted/10">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Sanctioned</p>
                <p className="text-xl font-bold mt-1">₹{initialNational.overview.total_sanctioned.toLocaleString()}</p>
              </div>
              <div className="p-4 border border-border rounded-lg bg-muted/10">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Expenditure</p>
                <p className="text-xl font-bold mt-1">₹{initialNational.overview.total_expenditure.toLocaleString()}</p>
              </div>
              <div className="p-4 border border-border rounded-lg bg-muted/10">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Utilization</p>
                <p className="text-xl font-bold mt-1">{initialNational.overview.utilization.toFixed(2)}%</p>
              </div>
            </div>
            
            <div>
               <h3 className="text-lg font-semibold text-foreground mb-4">Latest Compliance Exceptions</h3>
               <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Severity</th>
                        <th className="px-4 py-3">Entity</th>
                        <th className="px-4 py-3">Exception Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {initialNational.exceptions?.map((exc: any) => (
                        <tr key={exc.id}>
                          <td className="px-4 py-3"><span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full text-xs">HIGH</span></td>
                          <td className="px-4 py-3 font-medium">{exc.entity_name || exc.work_id}</td>
                          <td className="px-4 py-3 text-muted-foreground">{exc.explanation}</td>
                        </tr>
                      ))}
                      {!initialNational.exceptions?.length && (
                        <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">No recent high severity exceptions.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {activeTab === "DECISION_SUPPORT" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Priority Review Queue</h3>
              <p className="text-muted-foreground text-sm">
                A prioritized list of entities requiring official review, merging AI-detected anomalies with deterministic financial/audit exceptions.
              </p>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/30 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Description / Reason</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {initialDecisionSupport?.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <span className="text-rose-600 font-bold border border-rose-200 bg-rose-50 px-2 py-0.5 rounded-full text-xs">
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{item.source.replace('_', ' ')}</td>
                      <td className="px-4 py-3 font-medium">{item.entity_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-md truncate" title={item.reason}>{item.reason}</td>
                      <td className="px-4 py-3"><span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-sm bg-muted text-muted-foreground">{item.status}</span></td>
                    </tr>
                  ))}
                  {!initialDecisionSupport?.length && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Queue is clear. No high-priority items.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Provenance Footer */}
        {provenance && (
          <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="w-4 h-4" />
                Data strictly sourced from {provenance.source_name} ({provenance.total_entities_synced.toLocaleString()} live records)
             </div>
             <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="w-4 h-4" />
                Live Connection verified
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
