"use client";
import { API_URL } from '@/lib/api';


import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Building2, MapPin, CheckCircle2, ShieldCheck, Briefcase, Activity, IndianRupee, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import { FundingPipeline } from "@/components/charts/FundingPipeline";

function formatRs(amount: number) {
  if (amount == null) return "—";
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

function TimelineItem({ title, date, active, isLast }: { title: string, date: string | null, active: boolean, isLast?: boolean }) {
  return (
    <div className={`relative flex items-start ${!isLast ? 'pb-10' : ''}`}>
      {!isLast && (
        <div className={`absolute left-4 top-8 bottom-0 w-px ${active ? 'bg-primary' : 'bg-border'}`} />
      )}
      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-card shrink-0 ${active ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>
        {active ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-border" />}
      </div>
      <div className="ml-4 pt-1 flex flex-col">
        <span className={`text-sm font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</span>
        {date ? (
          <span className="text-xs text-muted-foreground mt-1 flex items-center">
            <Clock className="w-3 h-3 mr-1" /> {date}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50 mt-1 italic">Date unavailable</span>
        )}
      </div>
    </div>
  );
}

export default function WorkProfilePage() {
  const params = useParams();
  const router = useRouter();
  const workId = decodeURIComponent(params.workId as string);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWorkData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analytics/works/${encodeURIComponent(workId)}`);
        if (!res.ok) throw new Error("Not found");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkData();
  }, [workId]);

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
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-foreground">Work Record Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">Could not locate intelligence records for this specific work ID.</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Return to Database
        </button>
      </div>
    );
  }

  const isCompleted = (data.ACTUAL_AMOUNT || 0) > 0;
  const isHighRisk = data.risk_score >= 75;
  const isMediumRisk = data.risk_score >= 50 && data.risk_score < 75;

  const recDate = data.RECOMMENDATION_DATE;
  const sancDate = data.SANCTION_DATE;
  const expDate = data.EXPENDITURE_DATE;
  const compDate = data.ACTUAL_END_DATE;

  const utilization = data.SANCTION_AMOUNT > 0 ? ((data.FUND_DISBURSED_AMT || 0) / data.SANCTION_AMOUNT) * 100 : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24 transition-colors duration-300">
      
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Works Intelligence
      </button>

      {/* Header Overview */}
      <div className="mb-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center space-x-3 mb-4">
            <Badge variant="outline" className="font-mono">{data.WORK_RECOMMENDATION_DTL_ID}</Badge>
            <Badge variant={isCompleted ? "lowRisk" : "outline"} className={isCompleted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground"}>
              {isCompleted ? "Completed" : "Ongoing"}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            {data.WORK_DESCRIPTION || "Description unavailable"}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium mt-6">
            <Link href={`/mps/${encodeURIComponent(data.MP_NAME)}`} className="flex items-center text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-full transition-colors">
              <Briefcase className="w-4 h-4 mr-1.5" /> {data.MP_NAME}
            </Link>
            <span className="flex items-center text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <MapPin className="w-4 h-4 mr-1.5" /> {data.CONSTITUENCY}, {data.STATE_NAME}
            </span>
            <span className="flex items-center text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <Activity className="w-4 h-4 mr-1.5" /> {data.WORK_CATEGORY || "Uncategorized"}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Financial KPIs */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Recommended" 
            value={formatRs(data.RECOMMENDED_AMOUNT)} 
            icon={IndianRupee}
          />
          <MetricCard 
            title="Sanctioned" 
            value={formatRs(data.SANCTION_AMOUNT)} 
            icon={IndianRupee}
            highlight
          />
          <MetricCard 
            title="Expenditure" 
            value={formatRs(data.FUND_DISBURSED_AMT)} 
            icon={Activity}
            subtitle={`${utilization.toFixed(1)}% Sanction Utilized`}
          />
        </div>

        {/* AI Risk Indicator */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`bg-card border rounded-2xl p-6 flex flex-col justify-between ${isHighRisk ? 'border-rose-500/30 shadow-sm shadow-rose-500/10' : 'border-border shadow-sm'}`}
        >
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center justify-between">
              AI Risk Indicator
              <Badge variant={isHighRisk ? "highRisk" : isMediumRisk ? "mediumRisk" : "lowRisk"} animated={isHighRisk}>
                {isHighRisk ? "HIGH RISK" : isMediumRisk ? "MEDIUM RISK" : "LOW RISK"}
              </Badge>
            </div>
            
            <div className="flex items-end mb-6">
              <span className={`text-4xl font-bold tracking-tight mr-2 ${isHighRisk ? 'text-rose-500' : isMediumRisk ? 'text-amber-500' : 'text-emerald-500'}`}>
                {data.risk_score.toFixed(1)}
              </span>
              <span className="text-muted-foreground mb-1">/ 100</span>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            {data.top_reasons && data.top_reasons.length > 0 ? (
              data.top_reasons.map((reason: string, idx: number) => {
                const parts = reason.split('(');
                const title = parts[0];
                return (
                  <div key={idx} className="flex items-start text-sm text-foreground bg-muted/50 p-3 rounded-lg">
                    <AlertTriangle className={`w-4 h-4 mr-2 mt-0.5 shrink-0 ${isHighRisk ? 'text-rose-500' : 'text-amber-500'}`} />
                    <span className="leading-snug">{title.replace(/fraud|corruption/gi, "potential anomaly")}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
                No anomaly signal available
              </div>
            )}
            
            {(isHighRisk || isMediumRisk) && (
              <div className="text-xs text-muted-foreground/70 italic mt-2 border-t border-border pt-2">
                *Requires further review to determine context of deviations.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Execution Timeline */}
        <div className="bg-card/50 border border-border rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-foreground mb-8">Execution Timeline</h2>
          <div className="max-w-sm mx-auto ml-4">
            <TimelineItem title="Work Recommended" date={recDate} active={!!recDate} />
            <TimelineItem title="Work Sanctioned" date={sancDate} active={!!sancDate} />
            <TimelineItem title="Funds Disbursed / Execution" date={expDate} active={!!expDate} />
            <TimelineItem title="Work Completed" date={compDate} active={isCompleted} isLast />
          </div>
        </div>

        {/* Financial Lifecycle Pipeline */}
        <div className="bg-card/50 border border-border rounded-2xl p-8 flex flex-col justify-center">
          <h2 className="text-lg font-semibold text-foreground mb-8 text-center">Financial Lifecycle</h2>
          <FundingPipeline data={{
            allocated: data.RECOMMENDED_AMOUNT || 0, // Base it off recommended
            recommended: data.RECOMMENDED_AMOUNT || 0,
            sanctioned: data.SANCTION_AMOUNT || 0,
            expenditure: data.FUND_DISBURSED_AMT || 0
          }} />
        </div>
      </div>
      
    </div>
  );
}
