import { API_URL } from '@/lib/api';
import React from "react";
import { Database, Server, RefreshCw, FileText, CheckCircle2 } from "lucide-react";

async function getDataProfiles() {
  try {
    const res = await fetch(`${API_URL}/api/data/profile`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

async function getStatus() {
  try {
    const res = await fetch(`${API_URL}/api/data/status`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function DataSourcesPage() {
  const profiles = await getDataProfiles();
  const status = await getStatus();

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Data Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">Official provenance and integration mapping for Sentinel AI.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Server className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Upstream Connection</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Source System</p>
              <p className="font-medium text-foreground">Ministry of Statistics (eSAKSHI)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Connection Status</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{status?.data_source_status || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <RefreshCw className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Sync Metadata</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Last Successful Sync</p>
              <p className="font-medium text-foreground">
                {status?.last_successful_refresh ? new Date(status.last_successful_refresh).toLocaleString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Datasets Synced</p>
              <p className="font-medium text-foreground">{profiles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Local Warehouse</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Storage Engine</p>
              <p className="font-medium text-foreground">SQLite (Transactional)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Records Extracted</p>
              <p className="font-medium text-foreground">
                {profiles.reduce((acc: number, p: any) => acc + p.row_count, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Dataset Registry</h2>
        </div>
        <div className="divide-y divide-border">
          {profiles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No datasets synchronized yet.</div>
          ) : (
            profiles.map((profile: any, idx: number) => (
              <div key={idx} className="p-6 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground text-lg">{profile.report_name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Official JSON endpoint mapping to internal SQL schema.</p>
                </div>
                
                <div className="flex items-center gap-8 bg-muted/50 p-4 rounded-lg border border-border/50">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Records</p>
                    <p className="text-lg font-bold text-foreground">{profile.row_count.toLocaleString()}</p>
                  </div>
                  <div className="text-center border-l border-border pl-8">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Columns</p>
                    <p className="text-lg font-bold text-foreground">{profile.column_names.length}</p>
                  </div>
                  <div className="text-center border-l border-border pl-8">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Duplicates</p>
                    <p className={`text-lg font-bold ${profile.duplicate_row_count > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {profile.duplicate_row_count}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
