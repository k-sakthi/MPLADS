"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  AlertTriangle, ArrowRight, Brain, ChevronDown, ChevronUp, ExternalLink, 
  Info, Lightbulb, Shield, TrendingDown, TrendingUp, Users, Zap, 
  BarChart3, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface InsightItem {
  id: number;
  category: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  metric_value: string;
  related_entity: string | null;
}

interface AnomalyRecord {
  MP_NAME: string;
  CONSTITUENCY: string;
  STATE_NAME: string;
  risk_score: number;
  risk_level: string;
  top_reasons: string[];
  expenditure_amount: number;
  sanctioned_amount: number;
  expenditure_utilization: number;
  completion_ratio: number;
}

const formatRs = (val: number) => {
  if (!val) return "₹0";
  const cr = val / 10000000;
  if (cr >= 100) return `₹${cr.toFixed(0)} Cr`;
  if (cr >= 1) return `₹${cr.toFixed(1)} Cr`;
  return `₹${(val / 100000).toFixed(1)} L`;
};

export function IntelligenceClient({
  insights,
  anomalies,
  priorities,
  summary,
}: {
  insights: any;
  anomalies: any;
  priorities: any;
  summary: any;
}) {
  const router = useRouter();
  const [trendView, setTrendView] = useState<"recommendations" | "sanctions" | "expenditures" | "completions">("expenditures");
  const [trendData, setTrendData] = useState<any | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendsLoaded, setTrendsLoaded] = useState(false);

  const loadTrends = async () => {
    if (trendsLoaded) return;
    setTrendLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/analytics/intelligence/trends");
      const data = await res.json();
      setTrendData(data);
      setTrendsLoaded(true);
    } catch (err) { console.error(err); }
    setTrendLoading(false);
  };

  const severityStyles = {
    info: "bg-blue-50 border-blue-200 dark:bg-blue-500/5 dark:border-blue-500/20",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20",
    critical: "bg-rose-50 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/20",
  };
  const severityIcons = {
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    critical: <Zap className="w-5 h-5 text-rose-500" />,
  };

  return (
    <div className="space-y-8">
      {/* AI INSIGHT SUMMARY */}
      {insights?.insights && insights.insights.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold text-foreground">AI Intelligence Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.insights.map((insight: InsightItem) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: insight.id * 0.05 }}
                className={`border rounded-xl p-5 ${severityStyles[insight.severity]}`}
              >
                <div className="flex items-start gap-3">
                  {severityIcons[insight.severity]}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground">{insight.title}</h3>
                      <span className="text-xs font-bold bg-background/80 px-2 py-1 rounded-lg text-foreground">
                        {insight.metric_value}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{insight.category}</span>
                      {insight.related_entity && (
                        <button 
                          onClick={() => router.push(`/geography`)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View Details <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* PRIORITY AREAS + ANOMALY INTELLIGENCE */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Priority Areas */}
        {priorities?.top_risk_mps && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h2 className="text-xl font-semibold text-foreground">Priority Areas for Review</h2>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                {priorities.top_risk_mps.map((mp: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/mps/${encodeURIComponent(mp.MP_NAME)}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          mp.risk_level === 'HIGH' ? 'bg-rose-500' : mp.risk_level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        <span className="font-medium text-foreground truncate">{mp.MP_NAME}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{mp.CONSTITUENCY}</span>
                        <span>•</span>
                        <span>{mp.STATE_NAME}</span>
                      </div>
                      {mp.top_reasons && mp.top_reasons.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                          {mp.top_reasons[0]}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <span className={`text-xs font-bold ${
                          mp.risk_level === 'HIGH' ? 'text-rose-500' : mp.risk_level === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>{mp.risk_level}</span>
                        <p className="text-xs text-muted-foreground">{mp.risk_score?.toFixed(1)}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Anomaly Intelligence */}
        {anomalies && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-violet-500" />
              <h2 className="text-xl font-semibold text-foreground">Anomaly Intelligence</h2>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              {/* Anomaly Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{anomalies.summary.total_analyzed}</p>
                  <p className="text-xs text-muted-foreground">Analyzed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-rose-500">{anomalies.summary.high_risk}</p>
                  <p className="text-xs text-muted-foreground">High Risk</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-500">{anomalies.summary.medium_risk}</p>
                  <p className="text-xs text-muted-foreground">Medium Risk</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-500">{anomalies.summary.low_risk}</p>
                  <p className="text-xs text-muted-foreground">Low Risk</p>
                </div>
              </div>

              {/* Risk distribution bar */}
              <div className="h-3 flex rounded-full overflow-hidden mb-6">
                {anomalies.summary.total_analyzed > 0 && (
                  <>
                    <div className="bg-emerald-500" style={{ width: `${anomalies.summary.low_risk / anomalies.summary.total_analyzed * 100}%` }} />
                    <div className="bg-amber-500" style={{ width: `${anomalies.summary.medium_risk / anomalies.summary.total_analyzed * 100}%` }} />
                    <div className="bg-rose-500" style={{ width: `${anomalies.summary.high_risk / anomalies.summary.total_analyzed * 100}%` }} />
                  </>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                {anomalies.summary.anomaly_pct}% of analyzed constituencies show anomaly signals requiring review.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* TREND INTELLIGENCE */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-500" />
            <h2 className="text-xl font-semibold text-foreground">Trend Intelligence</h2>
          </div>
          {!trendsLoaded && (
            <button
              onClick={loadTrends}
              disabled={trendLoading}
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {trendLoading ? "Loading..." : "Load Trends"}
            </button>
          )}
        </div>

        {trendsLoaded && trendData && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex gap-2 mb-6 flex-wrap">
              {(["expenditures", "recommendations", "sanctions", "completions"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setTrendView(key)}
                  className={`text-sm px-4 py-2 rounded-lg transition-colors capitalize ${
                    trendView === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {trendData[trendView] && trendData[trendView].length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData[trendView]}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    fill="url(#trendGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No date data available for this category in the dataset.
              </div>
            )}
          </div>
        )}

        {!trendsLoaded && !trendLoading && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>Click "Load Trends" to analyze temporal patterns from the MPLADS dataset.</p>
            <p className="text-xs mt-1">This requires processing date fields from the works database.</p>
          </div>
        )}
      </section>

      {/* NATIONAL PRIORITY AREAS */}
      {priorities && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-semibold text-foreground">National Priority Areas</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Highest Expenditure States */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Highest Expenditure</h3>
              {priorities.highest_exp_states?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 px-2 rounded-lg transition-colors"
                  onClick={() => router.push(`/geography`)}
                >
                  <span className="text-sm font-medium text-foreground">{s.STATE_NAME}</span>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">{formatRs(s.expenditure)}</span>
                </div>
              ))}
            </div>

            {/* Lowest Utilization States */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Lowest Utilization</h3>
              {priorities.lowest_util_states?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 px-2 rounded-lg transition-colors"
                  onClick={() => router.push(`/geography`)}
                >
                  <span className="text-sm font-medium text-foreground">{s.STATE_NAME}</span>
                  <span className={`text-sm font-medium tabular-nums ${s.utilization < 30 ? 'text-rose-500' : 'text-amber-500'}`}>
                    {s.utilization?.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>

            {/* Highest Ongoing States */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Most Ongoing Works</h3>
              {priorities.highest_ongoing_states?.map((s: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 px-2 rounded-lg transition-colors"
                  onClick={() => router.push(`/works`)}
                >
                  <span className="text-sm font-medium text-foreground">{s.STATE_NAME}</span>
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-medium tabular-nums">{s.ongoing?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW AI WORKS - Transparency Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-violet-500" />
          <h2 className="text-xl font-semibold text-foreground">How AI Analysis Works</h2>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
            {[
              { label: "Official MPLADS Data", sub: "eSakshi Portal", icon: "📊" },
              { label: "Data Processing", sub: "SQL Aggregation", icon: "⚙️" },
              { label: "Feature Analysis", sub: "5 Key Metrics", icon: "📐" },
              { label: "Isolation Forest", sub: "ML Model", icon: "🌲" },
              { label: "Anomaly Score", sub: "0-100 Scale", icon: "📈" },
              { label: "Risk Classification", sub: "LOW / MED / HIGH", icon: "🏷️" },
              { label: "Human Review", sub: "Final Decision", icon: "👤" },
            ].map((step, i) => (
              <React.Fragment key={i}>
                <div className="text-center">
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <p className="text-xs font-semibold text-foreground">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground">{step.sub}</p>
                </div>
                {i < 6 && (
                  <div className="hidden md:flex justify-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Important:</strong> AI identifies unusual patterns in the data. 
              It does <em>not</em> determine wrongdoing. All flagged anomalies represent statistical deviations 
              that require human review and investigation before any conclusions can be drawn. The system uses 
              an Isolation Forest algorithm trained on expenditure utilization, sanction ratios, completion patterns, 
              and average work costs to identify multi-dimensional outliers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
