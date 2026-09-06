"use client";
import { API_URL } from '@/lib/api';


import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  IndianRupee, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Activity,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import { FundingPipeline } from "@/components/charts/FundingPipeline";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch lightweight dashboard summary
      const sumRes = await fetch(`${API_URL}/api/analytics/dashboard-summary`);
      if (sumRes.ok) {
        setSummary(await sumRes.json());
      }

      // Fetch anomalies preview
      const anomaliesRes = await fetch(`${API_URL}/api/analytics/anomalies?limit=4`);
      if (anomaliesRes.ok) {
        const data = await anomaliesRes.json();
        setAnomalies(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard data', e);
    }
    setLoading(false);
  };

  // Aggregations from summary API
  const totalAllocated = summary?.total_allocated || 0;
  const totalRecommended = summary?.total_recommended || 0;
  const totalSanctioned = summary?.total_sanctioned || 0;
  const totalExpenditure = summary?.total_expenditure || 0;
  
  const totalCompleted = summary?.total_completed || 0;
  const totalOngoing = summary?.total_ongoing || 0;

  const formatRs = (val: number) => {
    const cr = val / 10000000;
    if (cr >= 1) return `₹${cr.toFixed(1)} Cr`;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('en-IN').format(val || 0);
  };

  const worksData = [
    { name: "Completed Works", value: totalCompleted, color: "#10b981" },
    { name: "Ongoing Works", value: totalOngoing, color: "#6366f1" }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24 transition-colors duration-300">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">National Overview</h1>
        <p className="text-muted-foreground max-w-2xl">
          Real-time intelligence and monitoring of Members of Parliament Local Area Development Scheme (MPLADS) funds.
        </p>
      </motion.div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard 
          title="Total Allocated" 
          value={loading ? "..." : formatRs(totalAllocated)} 
          icon={IndianRupee}
          delay={0.1}
          highlight
        />
        <MetricCard 
          title="Total Expenditure" 
          value={loading ? "..." : formatRs(totalExpenditure)} 
          icon={Activity}
          subtitle={`${((totalExpenditure / totalAllocated) * 100 || 0).toFixed(1)}% National Utilization`}
          delay={0.2}
        />
        <MetricCard 
          title="Works Completed" 
          value={loading ? "..." : formatNumber(totalCompleted)} 
          icon={CheckCircle2}
          delay={0.3}
        />
        <MetricCard 
          title="Ongoing Works" 
          value={loading ? "..." : formatNumber(totalOngoing)} 
          icon={Clock}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Funding Pipeline */}
        <div className="lg:col-span-2">
          {loading ? (
             <div className="h-full min-h-[300px] bg-card/30 border border-border rounded-2xl p-8 flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             </div>
          ) : (
            <FundingPipeline data={{
              allocated: totalAllocated,
              recommended: totalRecommended,
              sanctioned: totalSanctioned,
              expenditure: totalExpenditure
            }} />
          )}
        </div>

        {/* Works Distribution */}
        <div className="bg-card/30 border border-border rounded-2xl p-6 flex flex-col transition-colors duration-300">
          <h3 className="text-sm font-semibold text-foreground mb-4">Works Execution Status</h3>
          <div className="flex-1 min-h-[250px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-8 border-muted animate-pulse" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={worksData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {worksData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-foreground)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: 'var(--color-foreground)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Anomaly Preview Section */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center text-foreground">
              <ShieldAlert className="w-5 h-5 mr-2 text-rose-500" />
              Intelligence Risk Indicators
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Machine Learning isolation forest tracking unusual deviations in MPLADS data.</p>
          </div>
          <Link href="/mps" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center transition-colors">
            View full report <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-card/30 border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-4 px-6 font-semibold">Member of Parliament</th>
                <th className="py-4 px-6 font-semibold">Constituency</th>
                <th className="py-4 px-6 font-semibold">Allocated</th>
                <th className="py-4 px-6 font-semibold">Utilization</th>
                <th className="py-4 px-6 font-semibold text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-card/20">
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-3/4"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-1/2"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-full"></div></td>
                    <td className="py-4 px-6 flex justify-end"><div className="h-6 bg-muted rounded-full w-16"></div></td>
                  </tr>
                ))
              ) : anomalies.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">No significant anomalies detected.</td></tr>
              ) : (
                anomalies.map((row, i) => {
                  const utilization = row.allocated_amount > 0 ? (row.expenditure_amount / row.allocated_amount) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-foreground">{row.MP_NAME}</td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">{row.CONSTITUENCY}, {row.STATE_NAME}</td>
                      <td className="py-4 px-6 text-sm font-mono text-muted-foreground">{formatRs(row.allocated_amount)}</td>
                      <td className="py-4 px-6">
                        <div className="w-full bg-muted rounded-full h-1.5 mb-1 overflow-hidden">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(utilization, 100)}%` }}></div>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">{utilization.toFixed(1)}%</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Badge variant={row.risk_score >= 75 ? "highRisk" : "mediumRisk"} animated>{row.risk_score.toFixed(1)} / 100</Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
