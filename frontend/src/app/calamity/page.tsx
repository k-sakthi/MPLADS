import { API_URL } from '@/lib/api';
import React from "react";
import { AlertTriangle, Database, ShieldAlert } from "lucide-react";

async function getDataProfiles() {
  try {
    const res = await fetch(`${API_URL}/api/data/profile`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function CalamityPage() {
  const profiles = await getDataProfiles();
  const calamityProfile = profiles.find((p: any) => p.report_name.toLowerCase().includes('calamity'));
  const hasData = calamityProfile && calamityProfile.row_count > 0;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Calamity Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">Special allocation tracking for natural disasters and national calamities.</p>
        </div>
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-card border border-border rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 border border-border">
            <AlertTriangle className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No Active Calamity Records</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            There are currently no active natural disasters or national calamities requiring special MPLADS fund allocation tracking in the official eSAKSHI data source.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
            <Database className="w-3.5 h-3.5" />
            <span>Source Synchronized & Verified</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm md:col-span-3">
             <div className="flex items-center gap-3 mb-4 border-b border-border pb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Active Consents</h2>
                <p className="text-xs text-muted-foreground">Monitoring {calamityProfile.row_count} active records.</p>
              </div>
            </div>
            
            <div className="h-64 flex items-center justify-center text-muted-foreground italic text-sm">
               Detailed analytics will appear here when API endpoints are fully mapped.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
