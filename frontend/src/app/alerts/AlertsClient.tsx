"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, AlertTriangle, Info, ShieldAlert, CheckCircle, Clock, XCircle, Search, SlidersHorizontal, ArrowRight, ExternalLink
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

export function AlertsClient({
  initialSummary,
  initialAlerts,
  categories,
  trends
}: {
  initialSummary: any;
  initialAlerts: any;
  categories: any;
  trends: any;
}) {
  const router = useRouter();
  const [alerts, setAlerts] = useState(initialAlerts?.data || []);
  const [summary, setSummary] = useState(initialSummary || null);
  const [loading, setLoading] = useState(false);
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const priorityStyles: Record<string, string> = {
    HIGH: "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20",
    MEDIUM: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20",
    LOW: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    INFO: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20",
  };

  const statusStyles: Record<string, string> = {
    OPEN: "text-rose-600 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-500/20 dark:bg-rose-500/10",
    UNDER_REVIEW: "text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-500/20 dark:bg-amber-500/10",
    RESOLVED: "text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/20 dark:bg-emerald-500/10",
    DISMISSED: "text-slate-600 border-slate-200 bg-slate-50 dark:text-slate-400 dark:border-slate-500/20 dark:bg-slate-500/10",
  };

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const url = new URL("http://127.0.0.1:8000/api/alerts");
      url.searchParams.append("limit", "50");
      url.searchParams.append("offset", "0");
      if (filterPriority !== "ALL") url.searchParams.append("priority", filterPriority);
      if (filterStatus !== "ALL") url.searchParams.append("status", filterStatus);
      
      const [alertRes, sumRes] = await Promise.all([
        fetch(url.toString()),
        fetch("http://127.0.0.1:8000/api/alerts/summary")
      ]);
      
      if (alertRes.ok) {
        const data = await alertRes.json();
        setAlerts(data.data);
      }
      if (sumRes.ok) {
        setSummary(await sumRes.json());
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Debounce or call on filter change
  React.useEffect(() => {
    fetchAlerts();
  }, [filterPriority, filterStatus]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/alerts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Alerts</span>
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.total}</p>
          </div>
          
          <div className="bg-card border border-rose-200 dark:border-rose-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">High Priority</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 relative z-10">{summary.high_priority}</p>
          </div>

          <div className="bg-card border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open / Review</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 relative z-10">{summary.open + summary.under_review}</p>
          </div>

          <div className="bg-card border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10">{summary.resolved}</p>
          </div>
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Detection Trend</h3>
          {trends && trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-muted-foreground)'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)'}} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm italic">
              No historical trend data available. Tracking begins from first detection cycle.
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Alert Distribution</h3>
          {categories && categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((c: any, i: number) => {
                // Ensure sum of all counts isn't 0
                const totalCats = categories.reduce((acc: number, cur: any) => acc + cur.count, 0);
                const pct = totalCats > 0 ? (c.count / totalCats) * 100 : 0;
                
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-foreground font-medium">{c.category.replace('_', ' ')}</span>
                      <span className="text-muted-foreground font-medium">{c.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm italic">
              No alerts detected.
            </div>
          )}
        </div>
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
                placeholder="Search alerts..." 
                className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <select 
                className="bg-transparent text-sm focus:outline-none cursor-pointer"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
                <option value="INFO">Info</option>
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
          <div className="col-span-1">Priority</div>
          <div className="col-span-2">Alert Type</div>
          <div className="col-span-3">Entity</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2">Metric</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {loading && alerts.length === 0 ? (
             <div className="p-8 text-center text-muted-foreground">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-3 opacity-80" />
              <p className="text-lg font-medium text-foreground">No alerts found</p>
              <p className="text-sm text-muted-foreground mt-1">All monitored systems are operating within expected parameters.</p>
            </div>
          ) : (
            alerts.map((alert: any) => (
              <React.Fragment key={alert.id}>
                {/* Main Row */}
                <div 
                  className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors cursor-pointer ${
                    expandedRow === alert.id ? 'bg-muted/30' : ''
                  }`}
                  onClick={() => setExpandedRow(expandedRow === alert.id ? null : alert.id)}
                >
                  <div className="col-span-1">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${priorityStyles[alert.priority]}`}>
                      {alert.priority}
                    </span>
                  </div>
                  <div className="col-span-2 font-medium text-foreground text-sm">
                    {alert.alert_type.replace('_', ' ')}
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm font-medium text-foreground truncate">{alert.entity_name}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{alert.entity_type}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-foreground truncate">{alert.state_name}</p>
                    {alert.constituency && <p className="text-xs text-muted-foreground truncate mt-0.5">{alert.constituency}</p>}
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-foreground">{alert.metric_name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5 tabular-nums">
                      {alert.observed_value !== null ? alert.observed_value.toFixed(1) : '-'}
                      {alert.reference_value !== null ? ` (Ref: ${alert.reference_value.toFixed(1)})` : ''}
                    </p>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${statusStyles[alert.status]}`}>
                      {alert.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                <AnimatePresence>
                  {expandedRow === alert.id && (
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
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Detection Details</h4>
                            <p className="text-sm text-foreground bg-background border border-border rounded-lg p-3 leading-relaxed">
                              {alert.description}
                            </p>
                          </div>
                          
                          {alert.alert_type === 'HIGH_ANOMALY' && (
                            <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-lg">
                              <Info className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                              <p className="text-xs text-rose-700 dark:text-rose-300">
                                <strong>Detected by Isolation Forest:</strong> AI identifies unusual patterns; human review is required. 
                                This is a statistical anomaly, not a confirmation of wrongdoing.
                              </p>
                            </div>
                          )}

                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommended Review Action</h4>
                            <div className="flex gap-2">
                              {alert.entity_type === 'MP' && (
                                <button 
                                  onClick={() => router.push(`/mps/${encodeURIComponent(alert.entity_name)}`)}
                                  className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                  Review MP Profile <ExternalLink className="w-4 h-4" />
                                </button>
                              )}
                              {alert.entity_type === 'STATE' && (
                                <button 
                                  onClick={() => router.push(`/geography`)}
                                  className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                  Review State Geography <ExternalLink className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Workflow Management</h4>
                            <div className="bg-background border border-border rounded-lg p-1 flex flex-col gap-1">
                              {['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((st) => (
                                <button
                                  key={st}
                                  onClick={() => updateStatus(alert.id, st)}
                                  className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${
                                    alert.status === st 
                                      ? 'bg-muted font-medium text-foreground cursor-default' 
                                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                  }`}
                                  disabled={alert.status === st}
                                >
                                  {st.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Detected At</h4>
                            <p className="text-sm font-mono text-foreground">{new Date(alert.detected_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Alert Fingerprint</h4>
                            <p className="text-[10px] font-mono text-muted-foreground truncate" title={alert.fingerprint}>{alert.fingerprint}</p>
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
        
        {/* Pagination stub */}
        {!loading && alerts.length > 0 && (
          <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center text-sm text-muted-foreground">
            <span>Showing {alerts.length} alerts</span>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-background border border-border rounded-lg disabled:opacity-50" disabled>Previous</button>
               <button className="px-3 py-1 bg-background border border-border rounded-lg disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
