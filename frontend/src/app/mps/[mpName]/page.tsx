"use client";
import { API_URL } from '@/lib/api';


import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldAlert, AlertTriangle, Building2, MapPin, IndianRupee, Activity, CheckCircle2 } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { FundingPipeline } from "@/components/charts/FundingPipeline";
import { Badge } from "@/components/ui/badge";

function formatRs(amount: number) {
  if (amount == null) return "₹0";
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function MPProfilePage() {
  const params = useParams();
  const router = useRouter();
  const mpName = decodeURIComponent(params.mpName as string);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMpData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analytics/mps/${encodeURIComponent(mpName)}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMpData();
  }, [mpName]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-foreground">MP Profile Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">Could not locate intelligence records for this representative.</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Return to Database
        </button>
      </div>
    );
  }

  const { overview, portfolio } = data;
  const utilization = overview.allocated_amount > 0 ? (overview.expenditure_amount / overview.allocated_amount) * 100 : 0;
  
  const isHighRisk = overview.risk_score >= 75;
  const isMediumRisk = overview.risk_score >= 50 && overview.risk_score < 75;

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24 transition-colors duration-300">
      
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to MP Monitoring
      </button>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-foreground mb-3">{overview.MP_NAME}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
            <span className="flex items-center text-muted-foreground bg-muted px-3 py-1 rounded-full">
              <Building2 className="w-4 h-4 mr-1.5" /> {overview.HOUSE_OF_PARLIAMENT}
            </span>
            <span className="flex items-center text-muted-foreground bg-muted px-3 py-1 rounded-full">
              <MapPin className="w-4 h-4 mr-1.5" /> {overview.CONSTITUENCY}, {overview.STATE_NAME}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border p-5 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 flex flex-col items-end min-w-[250px]"
        >
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Risk Assessment</div>
          <div className="flex items-center space-x-3">
            <span className={`text-4xl font-bold tracking-tight ${isHighRisk ? 'text-rose-500' : isMediumRisk ? 'text-amber-500' : 'text-emerald-500'}`}>
              {overview.risk_score.toFixed(1)}
            </span>
            <Badge variant={isHighRisk ? "highRisk" : isMediumRisk ? "mediumRisk" : "lowRisk"} animated={isHighRisk}>
              {isHighRisk ? "HIGH RISK" : isMediumRisk ? "MEDIUM RISK" : "LOW RISK"}
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard 
          title="Allocated Limit" 
          value={formatRs(overview.allocated_amount)} 
          icon={IndianRupee}
          delay={0.1}
          highlight
        />
        <MetricCard 
          title="Total Expenditure" 
          value={formatRs(overview.expenditure_amount)} 
          icon={Activity}
          subtitle={`${utilization.toFixed(1)}% Fund Utilization`}
          delay={0.2}
        />
        <MetricCard 
          title="Works Completed" 
          value={(overview.completed_works || 0).toString()} 
          icon={CheckCircle2}
          delay={0.3}
        />
        <MetricCard 
          title="Sanctioned Amount" 
          value={formatRs(overview.sanctioned_amount)} 
          icon={IndianRupee}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Funding Pipeline */}
        <div className="lg:col-span-2">
          <FundingPipeline data={{
            allocated: overview.allocated_amount || 0,
            recommended: overview.recommended_amount || 0,
            sanctioned: overview.sanctioned_amount || 0,
            expenditure: overview.expenditure_amount || 0
          }} />
        </div>

        {/* AI Anomaly Reasons */}
        <div className={`bg-card/50 border rounded-2xl p-6 flex flex-col ${isHighRisk ? 'border-rose-500/30' : 'border-border'}`}>
          <div className="flex items-center mb-6">
            <AlertTriangle className={`w-5 h-5 mr-2 ${isHighRisk ? 'text-rose-500' : 'text-muted-foreground'}`} />
            <h3 className="text-sm font-semibold text-foreground">Isolation Forest Intelligence</h3>
          </div>
          
          {overview.top_reasons && overview.top_reasons.length > 0 ? (
            <div className="space-y-4 flex-1">
              {overview.top_reasons.map((reason: string, idx: number) => {
                const parts = reason.split('(');
                const title = parts[0];
                const value = parts[1] ? `(${parts[1]}` : '';
                return (
                  <div key={idx} className="bg-muted/50 p-4 rounded-xl border border-border">
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    {value && <p className="text-xs text-muted-foreground mt-1">{value}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
              <p className="text-sm font-medium text-foreground">No significant anomalies detected</p>
              <p className="text-xs text-muted-foreground mt-1">Metrics align with standard operational variance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Work Portfolio */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">Recent Completed Works Portfolio</h2>
        <div className="bg-card/50 border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-muted z-10">
                <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-4 px-6 font-semibold">Work ID</th>
                  <th className="py-4 px-6 font-semibold">Actual Amount</th>
                  <th className="py-4 px-6 font-semibold">Nodal District</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {portfolio.completed.length === 0 ? (
                  <tr><td colSpan={3} className="py-12 text-center text-muted-foreground text-sm">No completed works found on record.</td></tr>
                ) : (
                  portfolio.completed.map((work: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-sm text-foreground">{work.WORK_ID || 'N/A'}</td>
                      <td className="py-4 px-6 font-medium text-foreground">{formatRs(work.ACTUAL_AMOUNT)}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{work.NODAL_DISTRICT_NAME || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}
