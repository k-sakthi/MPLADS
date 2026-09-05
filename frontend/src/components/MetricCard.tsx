"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
  highlight?: boolean;
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend, delay = 0, highlight = false }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-md p-5 transition-all duration-300 ${
        highlight 
          ? "border-primary/30 shadow-[0_0_30px_-5px_rgba(var(--primary),0.15)] ring-1 ring-primary/20" 
          : "border-border shadow-lg shadow-black/5 dark:shadow-black/20 hover:border-border/80 hover:bg-card/80 hover:shadow-xl"
      }`}
    >
      {highlight && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
      )}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`p-2 rounded-lg transition-colors ${highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="relative z-10">
        <p className={`text-3xl tracking-tight ${highlight ? 'text-foreground font-semibold' : 'text-foreground font-light'}`}>
          {value}
        </p>
        
        <div className="flex items-center mt-2 space-x-2">
          {trend && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              trend.isPositive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}>
              {trend.isPositive ? '+' : '-'}{trend.value}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
