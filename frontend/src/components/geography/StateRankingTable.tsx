"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

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

export function StateRankingTable({ initialStates, onStateClick }: { initialStates: StateData[], onStateClick?: (state: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof StateData>("expenditure_amount");
  const [sortDesc, setSortDesc] = useState(true);
  const [riskFilter, setRiskFilter] = useState<string>("ALL");

  const filteredStates = useMemo(() => {
    return initialStates.filter(state => {
      const matchesSearch = state.STATE_NAME.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === "ALL" || state.risk_level === riskFilter;
      return matchesSearch && matchesRisk;
    }).sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return sortDesc ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });
  }, [initialStates, searchTerm, sortField, sortDesc, riskFilter]);

  const toggleSort = (field: keyof StateData) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const SortIcon = ({ field }: { field: keyof StateData }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 opacity-20" />;
    return sortDesc ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />;
  };

  const formatRs = (val: number) => `₹${(val / 10000000).toFixed(1)} Cr`;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 border-b border-border">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search states..."
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted" onClick={() => toggleSort("STATE_NAME")}>
                <div className="flex items-center gap-1">State <SortIcon field="STATE_NAME" /></div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted text-right" onClick={() => toggleSort("sanctioned_amount")}>
                <div className="flex items-center justify-end gap-1">Sanctioned <SortIcon field="sanctioned_amount" /></div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted text-right" onClick={() => toggleSort("expenditure_amount")}>
                <div className="flex items-center justify-end gap-1">Expenditure <SortIcon field="expenditure_amount" /></div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted text-right" onClick={() => toggleSort("utilization")}>
                <div className="flex items-center justify-end gap-1">Util. % <SortIcon field="utilization" /></div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted text-right" onClick={() => toggleSort("completed_count")}>
                <div className="flex items-center justify-end gap-1">Works <SortIcon field="completed_count" /></div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:bg-muted" onClick={() => toggleSort("risk_score")}>
                <div className="flex items-center gap-1">Risk <SortIcon field="risk_score" /></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStates.map((state, i) => (
              <tr 
                key={state.STATE_NAME} 
                className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onStateClick && onStateClick(state.STATE_NAME)}
              >
                <td className="px-4 py-4 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs w-4">{i + 1}</span>
                    {state.STATE_NAME}
                  </div>
                </td>
                <td className="px-4 py-4 text-right tabular-nums">{formatRs(state.sanctioned_amount)}</td>
                <td className="px-4 py-4 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                  {formatRs(state.expenditure_amount)}
                </td>
                <td className="px-4 py-4 text-right tabular-nums">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    state.utilization >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                    state.utilization >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                    'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                  }`}>
                    {state.utilization.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-4 text-right tabular-nums">
                  {state.completed_count.toLocaleString()}
                  <span className="text-xs text-muted-foreground block">of {state.ongoing_count + state.completed_count}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {state.risk_level === 'HIGH' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                    <span className={`text-xs font-bold ${
                      state.risk_level === 'HIGH' ? 'text-rose-500' :
                      state.risk_level === 'MEDIUM' ? 'text-amber-500' :
                      'text-emerald-500'
                    }`}>
                      {state.risk_level}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No states found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
