"use client";

import React, { useState, useMemo } from "react";
import { scaleLinear } from "d3-scale";

interface StateData {
  STATE_NAME: string;
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

// Stylized Grid Map for India
// X, Y coordinates on a 10x10 grid (0-indexed)
const INDIA_GRID = [
  { code: "JK", name: "JAMMU AND KASHMIR", x: 2, y: 0 },
  { code: "LA", name: "LADAKH", x: 3, y: 0 },
  { code: "HP", name: "HIMACHAL PRADESH", x: 3, y: 1 },
  { code: "PB", name: "PUNJAB", x: 2, y: 2 },
  { code: "CH", name: "CHANDIGARH", x: 3, y: 2 },
  { code: "UK", name: "UTTARAKHAND", x: 4, y: 2 },
  { code: "HR", name: "HARYANA", x: 2, y: 3 },
  { code: "DL", name: "DELHI", x: 3, y: 3 },
  { code: "RJ", name: "RAJASTHAN", x: 1, y: 4 },
  { code: "UP", name: "UTTAR PRADESH", x: 4, y: 4 },
  { code: "BR", name: "BIHAR", x: 6, y: 4 },
  { code: "SK", name: "SIKKIM", x: 7, y: 4 },
  { code: "AR", name: "ARUNACHAL PRADESH", x: 9, y: 4 },
  { code: "GJ", name: "GUJARAT", x: 0, y: 5 },
  { code: "MP", name: "MADHYA PRADESH", x: 3, y: 5 },
  { code: "JH", name: "JHARKHAND", x: 5, y: 5 },
  { code: "WB", name: "WEST BENGAL", x: 6, y: 5 },
  { code: "AS", name: "ASSAM", x: 8, y: 5 },
  { code: "NL", name: "NAGALAND", x: 9, y: 5 },
  { code: "MH", name: "MAHARASHTRA", x: 2, y: 6 },
  { code: "CG", name: "CHHATTISGARH", x: 4, y: 6 },
  { code: "OR", name: "ODISHA", x: 5, y: 6 },
  { code: "ML", name: "MEGHALAYA", x: 7, y: 6 },
  { code: "MN", name: "MANIPUR", x: 9, y: 6 },
  { code: "TR", name: "TRIPURA", x: 7, y: 7 },
  { code: "MZ", name: "MIZORAM", x: 8, y: 7 },
  { code: "TG", name: "TELANGANA", x: 3, y: 7 },
  { code: "GA", name: "GOA", x: 1, y: 8 },
  { code: "KA", name: "KARNATAKA", x: 2, y: 8 },
  { code: "AP", name: "ANDHRA PRADESH", x: 4, y: 8 },
  { code: "KL", name: "KERALA", x: 2, y: 9 },
  { code: "TN", name: "TAMIL NADU", x: 3, y: 9 },
  { code: "PY", name: "PUDUCHERRY", x: 4, y: 9 },
  { code: "AN", name: "ANDAMAN AND NICOBAR ISLANDS", x: 9, y: 9 },
  { code: "LD", name: "LAKSHADWEEP", x: 0, y: 9 },
  { code: "DN", name: "DADRA AND NAGAR HAVELI", x: 0, y: 6 },
  { code: "DD", name: "DAMAN AND DIU", x: 1, y: 6 }
];

export function IndiaMap({ statesData, onStateClick }: { statesData: StateData[], onStateClick?: (state: string) => void }) {
  const [activeMetric, setActiveMetric] = useState<keyof StateData>("expenditure_amount");

  // Create a dictionary for O(1) lookups
  const dataMap = useMemo(() => {
    const map = new Map<string, StateData>();
    statesData.forEach(d => {
      map.set(d.STATE_NAME.toLowerCase().trim(), d);
    });
    return map;
  }, [statesData]);

  // Color scale
  const colorScale = useMemo(() => {
    if (activeMetric === "risk_score") {
      return scaleLinear<string>()
        .domain([0, 50, 100])
        .range(["#10b981", "#fbbf24", "#ef4444"]);
    }
    const maxVal = Math.max(...statesData.map(d => (d[activeMetric] as number) || 0), 1);
    return scaleLinear<string>()
      .domain([0, maxVal])
      .range(["#e0e7ff", "#4f46e5"]);
  }, [activeMetric, statesData]);

  const formatValue = (val: number, metric: string) => {
    if (metric.includes("amount") || metric.includes("expenditure")) {
      return `₹${(val / 10000000).toFixed(1)} Cr`;
    }
    if (metric === "utilization" || metric === "risk_score") {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString();
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      allocated_amount: "Allocated",
      recommended_amount: "Recommended",
      sanctioned_amount: "Sanctioned",
      expenditure_amount: "Expenditure",
      completed_count: "Completed Works",
      ongoing_count: "Ongoing Works",
      utilization: "Utilization",
      risk_score: "Risk Score"
    };
    return labels[metric] || metric;
  };

  return (
    <div className="w-full h-full relative flex flex-col p-4">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <select 
          className="bg-card border border-border text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          value={activeMetric}
          onChange={(e) => setActiveMetric(e.target.value as keyof StateData)}
        >
          <option value="allocated_amount">Allocated Amount</option>
          <option value="sanctioned_amount">Sanctioned Amount</option>
          <option value="expenditure_amount">Total Expenditure</option>
          <option value="completed_count">Completed Works</option>
          <option value="ongoing_count">Ongoing Works</option>
          <option value="utilization">Fund Utilization</option>
          <option value="risk_score">Risk / Anomaly</option>
        </select>
      </div>

      <div className="flex-1 flex items-center justify-center pt-12">
        <div className="relative w-full max-w-[600px] aspect-square">
          {INDIA_GRID.map((cell) => {
            let matchedData = dataMap.get(cell.name.toLowerCase());
            // Fuzzy fallback
            if (!matchedData) {
              for (let [key, val] of dataMap.entries()) {
                if (key.includes(cell.name.toLowerCase()) || cell.name.toLowerCase().includes(key)) {
                  matchedData = val;
                  break;
                }
              }
            }
            
            const value = matchedData ? (matchedData[activeMetric] as number) : 0;
            const bgColor = matchedData ? colorScale(value) : "#F3F4F6";
            
            return (
              <div 
                key={cell.code}
                className="absolute transition-all duration-300 hover:scale-110 hover:z-10 group cursor-pointer"
                style={{
                  left: `${cell.x * 10}%`,
                  top: `${cell.y * 10}%`,
                  width: '9.5%',
                  height: '9.5%',
                }}
                onClick={() => {
                  if (matchedData && onStateClick) {
                    onStateClick(matchedData.STATE_NAME);
                  }
                }}
              >
                <div 
                  className="w-full h-full rounded-xl flex items-center justify-center font-bold text-[10px] sm:text-sm text-foreground shadow-sm border border-black/10"
                  style={{ backgroundColor: bgColor }}
                >
                  <span className="opacity-70 mix-blend-plus-darker">{cell.code}</span>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-popover text-popover-foreground text-xs p-3 rounded-xl shadow-xl border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  <div className="font-bold border-b border-border pb-1 mb-1">{matchedData ? matchedData.STATE_NAME : cell.name}</div>
                  {matchedData ? (
                    <>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{getMetricLabel(activeMetric)}:</span> 
                        <span className="font-medium">{formatValue(value, activeMetric)}</span>
                      </div>
                      <div className="flex justify-between gap-4 mt-1">
                        <span className="text-muted-foreground">Expenditure:</span> 
                        <span className="font-medium">{formatValue(matchedData.expenditure_amount, 'expenditure_amount')}</span>
                      </div>
                      <div className="flex justify-between gap-4 mt-1">
                        <span className="text-muted-foreground">Utilization:</span> 
                        <span className={`font-medium ${matchedData.utilization < 50 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {formatValue(matchedData.utilization, 'utilization')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No MPLADS Data</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
