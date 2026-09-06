"use client";
import { API_URL } from '@/lib/api';


import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Briefcase, ExternalLink, Users } from "lucide-react";

interface ConstituencyData {
  MP_NAME: string;
  CONSTITUENCY: string;
  allocated_amount: number;
  recommended_amount: number;
  sanctioned_amount: number;
  expenditure_amount: number;
  completed_count: number;
  ongoing_count: number;
  utilization: number;
  risk_score: number;
  risk_level: string;
}

export function ConstituencyDrilldown({ stateName }: { stateName: string }) {
  const [data, setData] = useState<ConstituencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`${API_URL}/api/analytics/geography/constituencies?state=${encodeURIComponent(stateName)}`)
      .then(res => res.json())
      .then(json => {
        if (isMounted) {
          // Sort by risk desc by default
          const sorted = (json.data || []).sort((a: any, b: any) => b.risk_score - a.risk_score);
          setData(sorted);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [stateName]);

  const formatRs = (val: number) => `₹${(val / 10000000).toFixed(2)} Cr`;

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full p-8 text-center text-muted-foreground border border-border rounded-xl">
        No constituencies found for {stateName}.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
      {data.map((c, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-indigo-500/50 transition-colors shadow-sm group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg text-foreground line-clamp-1" title={c.CONSTITUENCY}>
                {c.CONSTITUENCY}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="w-3 h-3" /> {c.MP_NAME}
              </p>
            </div>
            {c.risk_level === 'HIGH' && (
              <div className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 p-1.5 rounded-lg" title="High Risk">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sanctioned</span>
              <span className="font-medium">{formatRs(c.sanctioned_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expenditure</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatRs(c.expenditure_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Works Completed</span>
              <span className="font-medium">{c.completed_count} <span className="text-xs text-muted-foreground">/ {c.completed_count + c.ongoing_count}</span></span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 border-t border-border pt-4 mt-auto">
            <button 
              onClick={() => router.push(`/mps/${encodeURIComponent(c.MP_NAME)}`)}
              className="flex-1 flex justify-center items-center gap-1.5 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 rounded-lg transition-colors"
            >
              <Users className="w-3 h-3" /> MP Profile
            </button>
            <button 
              onClick={() => router.push(`/works?mp=${encodeURIComponent(c.MP_NAME)}`)}
              className="flex-1 flex justify-center items-center gap-1.5 text-xs font-medium border border-border hover:bg-muted py-2 rounded-lg transition-colors"
            >
              <Briefcase className="w-3 h-3" /> View Works
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
