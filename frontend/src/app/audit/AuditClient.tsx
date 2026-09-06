"use client";
import { API_URL } from '@/lib/api';


import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, AlertTriangle, FileText, CheckCircle, Clock, Search, SlidersHorizontal, ArrowRight, Activity, Database, RefreshCw, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export function AuditClient({
  initialSummary,
  initialExceptions,
  provenance,
  trends
}: {
  initialSummary: any;
  initialExceptions: any;
  provenance: any;
  trends: any;
}) {
  const [exceptions, setExceptions] = useState(initialExceptions?.data || []);
  const [summary, setSummary] = useState(initialSummary || null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const severityStyles: Record<string, string> = {
    HIGH: "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20",
    MEDIUM: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20",
    LOW: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20",
  };

  const statusStyles: Record<string, string> = {
    OPEN: "text-rose-600 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-500/20 dark:bg-rose-500/10",
    UNDER_REVIEW: "text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-500/20 dark:bg-amber-500/10",
    RESOLVED: "text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/20 dark:bg-emerald-500/10",
    DISMISSED: "text-slate-600 border-slate-200 bg-slate-50 dark:text-slate-400 dark:border-slate-500/20 dark:bg-slate-500/10",
  };

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/audit`);
      url.searchParams.append("limit", "50");
      url.searchParams.append("offset", "0");
      if (filterCategory !== "ALL") url.searchParams.append("category", filterCategory);
      if (filterSeverity !== "ALL") url.searchParams.append("severity", filterSeverity);
      if (filterStatus !== "ALL") url.searchParams.append("status", filterStatus);
      
      const [exRes, sumRes] = await Promise.all([
        fetch(url.toString()),
        fetch(`${API_URL}/api/audit/summary`)
      ]);
      
      if (exRes.ok) {
        const data = await exRes.json();
        setExceptions(data.data);
      }
      if (sumRes.ok) {
        setSummary(await sumRes.json());
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchExceptions();
  }, [filterCategory, filterSeverity, filterStatus]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/audit/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchExceptions();
    } catch (err) { console.error(err); }
  };

  const generateAudit = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/audit/generate`, { method: "POST" });
      if (res.ok) {
        // Refresh page to get latest trends and summary
        window.location.reload();
      }
    } catch (err) { console.error(err); }
    setGenerating(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Controls */}
      <div className="flex justify-between items-end">
        {provenance && (
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Data Provenance</p>
                <p className="text-sm font-medium text-foreground">{provenance.source_name}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Last Sync</p>
              <p className="text-sm font-medium text-foreground">{new Date(provenance.last_sync).toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Records Validated</p>
              <p className="text-sm font-medium text-foreground">{provenance.total_entities_synced.toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Live Connection</span>
            </div>
          </div>
        )}

        <button 
          onClick={generateAudit}
          disabled={generating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-md disabled:opacity-70"
        >
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          Run Audit Engine
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Records Checked</span>
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.records_checked.toLocaleString()}</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Exceptions Detected</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">{summary.exceptions_detected}</p>
              <span className="text-sm text-rose-500 font-medium">{summary.high_severity} High</span>
            </div>
          </div>

          <div className="bg-card border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Data Quality Score</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10">{summary.data_quality_score}%</p>
          </div>

          <div className="bg-card border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Financial Consistency</span>
              <Activity className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 relative z-10">{summary.financial_consistency_rate}%</p>
          </div>
        </div>
      )}

      {/* Exception Trend */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Historical Exception Trend</h3>
        {trends && trends.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)'}} />
              <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm italic bg-muted/20 rounded-lg border border-dashed border-border">
            Historical trend unavailable. Run the Audit Engine to establish a baseline.
          </div>
        )}
      </div>

      {/* Main Table Section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search exceptions..." 
                className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <select 
                className="bg-transparent text-sm focus:outline-none cursor-pointer"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="DATA_QUALITY">Data Quality</option>
                <option value="FINANCIAL">Financial Consistency</option>
                <option value="WORKFLOW">Workflow Consistency</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
              <select 
                className="bg-transparent text-sm focus:outline-none cursor-pointer"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
              <select 
                className="bg-transparent text-sm focus:outline-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1">Severity</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-3">Entity</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {loading && exceptions.length === 0 ? (
             <div className="p-8 text-center text-muted-foreground">Loading exceptions...</div>
          ) : exceptions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mb-3 opacity-80" />
              <p className="text-lg font-medium text-foreground">No Exceptions Found</p>
              <p className="text-sm text-muted-foreground mt-1">All data complies with active validation rules.</p>
            </div>
          ) : (
            exceptions.map((exc: any) => (
              <React.Fragment key={exc.id}>
                {/* Main Row */}
                <div 
                  className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors cursor-pointer ${
                    expandedRow === exc.id ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => setExpandedRow(expandedRow === exc.id ? null : exc.id)}
                >
                  <div className="col-span-1">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${severityStyles[exc.severity]}`}>
                      {exc.severity}
                    </span>
                  </div>
                  <div className="col-span-2 font-medium text-foreground text-sm">
                    {exc.exception_category.replace('_', ' ')}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {exc.exception_type.replace(/_/g, ' ')}
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-foreground truncate">{exc.entity_name || exc.work_id}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{exc.entity_type}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-foreground truncate">{exc.state_name || 'N/A'}</p>
                    {exc.constituency && <p className="text-xs text-muted-foreground truncate mt-0.5">{exc.constituency}</p>}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${statusStyles[exc.status]}`}>
                      {exc.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                <AnimatePresence>
                  {expandedRow === exc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-muted/10 border-b border-border"
                    >
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deterministic Exception Details</h4>
                            <div className="bg-background border border-border rounded-lg p-4">
                               <p className="text-sm text-foreground font-medium mb-2">{exc.explanation}</p>
                               <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Detected At</span>
                                    <span className="text-sm font-mono">{new Date(exc.detected_at).toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Entity ID</span>
                                    <span className="text-sm font-mono truncate max-w-[200px]" title={exc.work_id}>{exc.work_id || exc.entity_name}</span>
                                  </div>
                               </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-indigo-700 dark:text-indigo-300">
                              <strong>Audit Note:</strong> This is a deterministic data validation exception. It is distinct from the AI anomaly model and indicates a structural or logical inconsistency in the official record.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workflow Management</h4>
                            <div className="bg-background border border-border rounded-lg p-1 flex flex-col gap-1">
                              {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((st) => (
                                <button
                                  key={st}
                                  onClick={() => updateStatus(exc.id, st)}
                                  className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${
                                    exc.status === st 
                                      ? 'bg-muted font-medium text-foreground cursor-default' 
                                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                  }`}
                                  disabled={exc.status === st}
                                >
                                  {st.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
