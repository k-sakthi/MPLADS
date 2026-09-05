"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface PipelineData {
  allocated: number;
  recommended: number;
  sanctioned: number;
  expenditure: number;
}

export function FundingPipeline({ data }: { data: PipelineData }) {
  const formatRs = (val: number) => {
    // format as Crores (Cr)
    const cr = val / 10000000;
    if (cr >= 100) return `₹${cr.toFixed(0)} Cr`;
    if (cr >= 1) return `₹${cr.toFixed(1)} Cr`;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const steps = [
    { name: "Allocated", value: data.allocated, color: "bg-indigo-500", glow: "shadow-indigo-500/20" },
    { name: "Recommended", value: data.recommended, color: "bg-blue-500", glow: "shadow-blue-500/20" },
    { name: "Sanctioned", value: data.sanctioned, color: "bg-cyan-500", glow: "shadow-cyan-500/20" },
    { name: "Expenditure", value: data.expenditure, color: "bg-emerald-500", glow: "shadow-emerald-500/20" },
  ];

  const maxVal = Math.max(...steps.map(s => s.value), 1);

  return (
    <div className="bg-card/30 border border-border rounded-2xl p-8 relative overflow-hidden transition-colors duration-300">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Funding Pipeline</h3>
          <p className="text-sm text-muted-foreground">Lifecycle drop-off from allocation to actual expenditure</p>
        </div>
      </div>

      <div className="flex justify-between items-end relative px-4 pt-4">
        {steps.map((step, i) => {
          const heightPct = Math.max((step.value / maxVal) * 100, 5); // min 5% height
          
          return (
            <React.Fragment key={step.name}>
              <div className="flex flex-col items-center flex-1 z-10 group">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="mb-4 text-center"
                >
                  <p className="text-xl font-medium text-foreground">{formatRs(step.value)}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{step.name}</p>
                </motion.div>

                <div className="w-full flex justify-center items-end h-32 relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ delay: 0.3 + (i * 0.1), duration: 0.8, type: "spring" }}
                    className={`w-16 rounded-t-xl ${step.color} opacity-80 shadow-lg ${step.glow} group-hover:opacity-100 transition-opacity`}
                  >
                    <div className="w-full h-1 bg-white/40 rounded-t-xl absolute top-0" />
                  </motion.div>
                </div>
              </div>

              {i < steps.length - 1 && (
                <div className="flex-1 flex justify-center items-center h-32 relative z-0">
                  <motion.div 
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                    className="w-full h-px bg-border absolute top-1/2 -translate-y-1/2 origin-left"
                  />
                  <ArrowRight className="w-4 h-4 text-muted-foreground relative z-10 bg-card rounded-full" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
