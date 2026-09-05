import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { AlertCircle, FileWarning, TrendingUp, IndianRupee } from "lucide-react";

interface AnomalyData {
  MP_NAME: string;
  CONSTITUENCY: string;
  STATE_NAME: string;
  allocated_amount: number;
  expenditure_amount: number;
  sanctioned_amount: number;
  risk_score: number;
  risk_level: string;
  top_reasons: string[];
}

export function RiskScoreCard({ data, index }: { data: AnomalyData; index: number }) {
  const isHighRisk = data.risk_level === "HIGH";
  const badgeVariant = isHighRisk ? "highRisk" : data.risk_level === "MEDIUM" ? "mediumRisk" : "lowRisk";

  // Formatter for Indian Rupees
  const formatRs = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
    >
      {/* Decorative gradient blob */}
      <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl opacity-20 ${isHighRisk ? 'bg-rose-500' : 'bg-amber-500'}`} />

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100">{data.MP_NAME}</h3>
          <p className="text-sm text-slate-400">{data.CONSTITUENCY}, {data.STATE_NAME}</p>
        </div>
        <div className="flex flex-col items-end">
          <Badge variant={badgeVariant} animated className="text-sm px-3 py-1 mb-1">
            {data.risk_level} RISK
          </Badge>
          <span className="text-xs font-mono text-slate-500">SCORE: {data.risk_score}/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
          <div className="flex items-center text-slate-400 mb-1">
            <IndianRupee className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium uppercase tracking-wider">Allocated</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">{formatRs(data.allocated_amount)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
          <div className="flex items-center text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium uppercase tracking-wider">Expenditure</span>
          </div>
          <p className="text-sm font-semibold text-slate-200">{formatRs(data.expenditure_amount)}</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-slate-300 flex items-center mb-2">
          <AlertCircle className="w-4 h-4 mr-1.5 text-indigo-400" />
          AI Analysis Reasoning
        </h4>
        <ul className="space-y-2">
          {data.top_reasons.map((reason, i) => (
            <motion.li 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index * 0.1) + (i * 0.1) + 0.3 }}
              key={i} 
              className="text-xs text-slate-400 flex items-start"
            >
              <span className="mr-2 mt-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500/50 shrink-0" />
              {reason}
            </motion.li>
          ))}
          {data.top_reasons.length === 0 && (
            <li className="text-xs text-slate-500 italic">No specific anomaly patterns identified.</li>
          )}
        </ul>
      </div>
    </motion.div>
  );
}
