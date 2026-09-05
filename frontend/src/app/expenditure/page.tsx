"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { IndianRupee, PieChart as PieChartIcon, BarChart3, TrendingUp, AlertTriangle, ChevronRight, Briefcase, CheckCircle2 } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid 
} from "recharts";
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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const UTIL_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

export default function ExpenditurePage() {
  const [summary, setSummary] = useState<any>(null);
  const [dist, setDist] = useState<any>(null);
  const [statesData, setStatesData] = useState<any[]>([]);
  const [topWorks, setTopWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, distRes, stateRes, topRes] = await Promise.all([
          fetch('http://localhost:8000/api/analytics/expenditure/summary'),
          fetch('http://localhost:8000/api/analytics/expenditure/distribution'),
          fetch('http://localhost:8000/api/analytics/expenditure/states'),
          fetch('http://localhost:8000/api/analytics/expenditure/top-works?limit=10')
        ]);
        
        if (sumRes.ok) setSummary(await sumRes.json());
        if (distRes.ok) setDist(await distRes.json());
        if (stateRes.ok) setStatesData(await stateRes.json());
        if (topRes.ok) setTopWorks(await topRes.json());
        
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto pb-24 transition-colors duration-300">
      
      {/* Header */}
      <div className="mb-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
            <IndianRupee className="w-8 h-8 mr-3 text-primary" />
            Expenditure Intelligence
          </h1>
          <p className="text-muted-foreground max-w-3xl leading-relaxed">
            Macro and micro-level financial analysis of MPLADS fund utilization. 
            Track where money is being spent, identify unusual spending patterns, and assess national utilization efficiency.
          </p>
        </motion.div>
      </div>

      {/* Top KPIs */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <MetricCard 
            title="Total Expenditure" 
            value={formatRs(summary.total_expenditure)} 
            icon={TrendingUp}
            delay={0.1}
            highlight
          />
          <MetricCard 
            title="National Utilization" 
            value={`${summary.overall_utilization.toFixed(1)}%`} 
            subtitle="Against Total Sanctioned"
            icon={PieChartIcon}
            delay={0.2}
          />
          <MetricCard 
            title="Completed Work Expenditure" 
            value={formatRs(summary.completed_expenditure)} 
            icon={CheckCircle2}
            delay={0.3}
          />
          <MetricCard 
            title="Avg. Expenditure per Work" 
            value={formatRs(summary.average_expenditure)} 
            icon={BarChart3}
            delay={0.4}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* National State Distribution */}
        {dist && dist.states && dist.states.length > 0 && (
          <div className="lg:col-span-2 bg-card/50 border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-6">Top Expenditure by State</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist.states} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(val) => `₹${(val/10000000).toFixed(0)}Cr`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="STATE_NAME" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{fill: "hsl(var(--foreground))"}} />
                  <Tooltip 
                    cursor={{fill: "hsl(var(--muted))", opacity: 0.4}}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: '8px' }}
                    formatter={(value: any) => [formatRs(value), "Expenditure"]}
                  />
                  <Bar dataKey="FUND_DISBURSED_AMT" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Utilization Bracket Distribution */}
        {dist && dist.utilization && dist.utilization.length > 0 && (
          <div className="bg-card/50 border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-foreground mb-2 self-start w-full">Utilization Distribution</h2>
            <p className="text-xs text-muted-foreground mb-4 self-start">Percentage of sanctioned funds disbursed per work</p>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dist.utilization}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="bracket"
                  >
                    {dist.utilization.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={UTIL_COLORS[index % UTIL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: '8px' }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(val) => [`${val} works`, 'Count']}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* State Ranking Table */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-6">State Expenditure Intelligence</h2>
        <div className="bg-card/50 border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="sticky top-0 bg-muted z-10">
                <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-4 px-6 font-semibold">State / Territory</th>
                  <th className="py-4 px-6 font-semibold text-right">Sanctioned</th>
                  <th className="py-4 px-6 font-semibold text-right">Expenditure</th>
                  <th className="py-4 px-6 font-semibold text-right">Utilization</th>
                  <th className="py-4 px-6 font-semibold text-right">Works (Comp/Ong)</th>
                  <th className="py-4 px-6 font-semibold text-right">Avg Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statesData.map((state, i) => (
                  <tr key={i} className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-foreground">{state.STATE_NAME}</td>
                    <td className="py-4 px-6 text-sm font-mono text-muted-foreground text-right">{formatRs(state.sanctioned)}</td>
                    <td className="py-4 px-6 text-sm font-mono text-foreground font-medium text-right">{formatRs(state.expenditure)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-16 bg-muted rounded-full h-1.5 mr-3 overflow-hidden">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(state.utilization, 100)}%` }}></div>
                        </div>
                        <span className="text-sm font-mono">{state.utilization.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-sm">
                      <span className="text-emerald-500 font-medium">{state.completed_works}</span>
                      <span className="mx-1 text-muted-foreground">/</span>
                      <span className="text-amber-500 font-medium">{state.ongoing_works}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Badge variant={state.avg_risk >= 75 ? "highRisk" : state.avg_risk >= 50 ? "mediumRisk" : "lowRisk"}>
                        {state.avg_risk.toFixed(1)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Expenditure Works */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-foreground mb-6">Top Expenditure Works (Highest Value)</h2>
        <div className="bg-card/50 border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-muted/50">
                <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-4 px-6 font-semibold min-w-[300px]">Work Description</th>
                  <th className="py-4 px-6 font-semibold">Location</th>
                  <th className="py-4 px-6 font-semibold text-right">Expenditure</th>
                  <th className="py-4 px-6 font-semibold text-center">Anomaly Signal</th>
                  <th className="py-4 px-6 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topWorks.map((work, i) => (
                  <tr key={i} className="hover:bg-muted/60 transition-colors group">
                    <td className="py-4 px-6 whitespace-normal min-w-[300px]">
                      <div className="font-medium text-sm text-foreground line-clamp-2 leading-relaxed">
                        {work.WORK_DESCRIPTION || '—'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="font-medium text-foreground">{work.MP_NAME || '—'}</div>
                      <div className="text-muted-foreground text-xs">{work.STATE_NAME}</div>
                    </td>
                    <td className="py-4 px-6 text-sm font-mono text-primary font-medium text-right">
                      {formatRs(work.FUND_DISBURSED_AMT)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {work.risk_score >= 75 ? (
                        <div className="flex items-center justify-center text-rose-500 text-xs font-medium bg-rose-500/10 px-2 py-1 rounded-full w-max mx-auto border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Requires review
                        </div>
                      ) : work.risk_score >= 50 ? (
                        <div className="flex items-center justify-center text-amber-500 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded-full w-max mx-auto border border-amber-500/20">
                          Potential anomaly
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No signal</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/works/${encodeURIComponent(work.WORK_RECOMMENDATION_DTL_ID)}`} className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary transition-colors rounded-md">
                        Details <ChevronRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
