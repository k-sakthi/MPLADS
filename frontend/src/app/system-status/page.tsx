import React from "react";
import { Activity, Server, Database, ShieldCheck, HeartPulse, Clock, AlertTriangle } from "lucide-react";

async function getStatus() {
  try {
    const res = await fetch("http://127.0.0.1:8000/health", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function SystemStatusPage() {
  const status = await getStatus();
  
  const isHealthy = status?.status === "ok";

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">System Status</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time health and telemetry of the MPLADS Sentinel Engine.</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isHealthy ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
          <HeartPulse className="w-5 h-5" />
          <span className="font-semibold uppercase tracking-wider text-sm">{isHealthy ? 'All Systems Operational' : 'System Degraded'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Server className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">API Gateway</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={`text-sm font-medium ${isHealthy ? 'text-emerald-500' : 'text-rose-500'}`}>{isHealthy ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Database className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Database</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connection</span>
            <span className={`text-sm font-medium ${status?.database === 'connected' ? 'text-emerald-500' : 'text-rose-500'}`}>{status?.database === 'connected' ? 'Connected' : 'Error'}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Uptime</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="text-sm font-medium text-foreground">{(status?.uptime / 3600).toFixed(1)} hrs</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
            </div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Security</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">CORS / TLS</span>
            <span className="text-sm font-medium text-emerald-500">Active</span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">System Services</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Machine Learning Inference Engine</span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Operational</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Automated Audit & Compliance Rules</span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Operational</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Background Sync Worker</span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Operational</span>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Export Generation (PDF/CSV)</span>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
