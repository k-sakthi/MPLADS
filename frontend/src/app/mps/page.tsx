"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ShieldAlert, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

const STATES = [
  "Andaman And Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra And Nagar Haveli", "Daman And Diu", "Delhi", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu And Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal"
];

function formatRs(amount: number) {
  if (amount == null) return "₹0";
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function MPSPage() {
  const router = useRouter();
  const [mps, setMps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Table state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [houseFilter, setHouseFilter] = useState("");
  const [sortBy, setSortBy] = useState("allocated_amount");
  const [sortDesc, setSortDesc] = useState(true); // using boolean

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_desc: sortDesc ? "true" : "false"
      });
      if (debouncedSearch) query.append("search", debouncedSearch);
      if (stateFilter) query.append("state", stateFilter);
      if (houseFilter && houseFilter !== 'All') query.append("house", houseFilter);

      const res = await fetch(`http://localhost:8000/api/analytics/mps?${query}`);
      if (res.ok) {
        const data = await res.json();
        setMps(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, debouncedSearch, stateFilter, houseFilter, sortBy, sortDesc]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ChevronDown className="w-3 h-3 ml-1 opacity-20" />;
    return sortDesc ? <ChevronDown className="w-3 h-3 ml-1 text-primary" /> : <ChevronUp className="w-3 h-3 ml-1 text-primary" />;
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto pb-24 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Member of Parliament Monitoring</h1>
          <p className="text-muted-foreground max-w-2xl">
            Detailed performance tracking and risk assessment for all MPs utilizing MPLADS funding.
          </p>
        </motion.div>
        
        <div className="flex items-center space-x-4 mt-6 md:mt-0">
          <div className="text-sm text-muted-foreground flex items-center">
            <span className="font-semibold text-foreground mr-1.5">{total.toLocaleString('en-IN')}</span> 
            Records found
          </div>
          <button 
            onClick={fetchData}
            className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by MP name, constituency, or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground shadow-sm"
          />
        </div>

        <div className="flex space-x-4">
          <div className="relative">
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-card border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm w-48"
            >
              <option value="">All States</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={houseFilter}
              onChange={(e) => { setHouseFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-card border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm w-40"
            >
              <option value="All">All Houses</option>
              <option value="Lok Sabha">Lok Sabha</option>
              <option value="Rajya Sabha">Rajya Sabha</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {(search || stateFilter || (houseFilter && houseFilter !== 'All')) && (
            <button
              onClick={() => { setSearch(""); setStateFilter(""); setHouseFilter("All"); }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-card/50 border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none" onClick={() => handleSort("MP_NAME")}>
                  <div className="flex items-center group-hover:text-foreground transition-colors">
                    Member of Parliament <SortIcon column="MP_NAME" />
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none" onClick={() => handleSort("STATE_NAME")}>
                  <div className="flex items-center group-hover:text-foreground transition-colors">
                    State / Constituency <SortIcon column="STATE_NAME" />
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none" onClick={() => handleSort("allocated_amount")}>
                  <div className="flex items-center justify-end group-hover:text-foreground transition-colors">
                    Allocated <SortIcon column="allocated_amount" />
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none" onClick={() => handleSort("expenditure_amount")}>
                  <div className="flex items-center justify-end group-hover:text-foreground transition-colors">
                    Utilization <SortIcon column="expenditure_amount" />
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none" onClick={() => handleSort("completed_works")}>
                  <div className="flex items-center justify-end group-hover:text-foreground transition-colors">
                    Works (Completed / Ongoing) <SortIcon column="completed_works" />
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none text-right" onClick={() => handleSort("risk_score")}>
                  <div className="flex items-center justify-end group-hover:text-foreground transition-colors">
                    Risk Score <SortIcon column="risk_score" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-card/20">
                    <td className="py-5 px-6"><div className="h-4 bg-muted rounded w-3/4"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-muted rounded w-1/2"></div></td>
                    <td className="py-5 px-6 flex justify-end"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-muted rounded w-full"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-muted rounded w-32 ml-auto"></div></td>
                    <td className="py-5 px-6 flex justify-end"><div className="h-6 bg-muted rounded-full w-16"></div></td>
                  </tr>
                ))
              ) : mps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <SlidersHorizontal className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-foreground font-medium">No records found</p>
                    <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                mps.map((mp, i) => {
                  const utilization = mp.allocated_amount > 0 ? (mp.expenditure_amount / mp.allocated_amount) * 100 : 0;
                  
                  return (
                      <tr key={i} onClick={() => router.push(`/mps/${encodeURIComponent(mp.MP_NAME)}`)} className="hover:bg-muted/60 transition-colors cursor-pointer group">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {mp.MP_NAME}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {mp.HOUSE_OF_PARLIAMENT || "Lok Sabha"}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <div className="text-foreground">{mp.STATE_NAME}</div>
                          <div className="text-muted-foreground">{mp.CONSTITUENCY}</div>
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-muted-foreground text-right">
                          {formatRs(mp.allocated_amount)}
                        </td>
                        <td className="py-4 px-6 min-w-[200px]">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground font-medium">{formatRs(mp.expenditure_amount)}</span>
                            <span className="text-muted-foreground font-mono">{utilization.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(utilization, 100)}%` }}></div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <div className="flex flex-col items-end">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{mp.completed_works || 0}</span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</span>
                            </div>
                            <div className="h-6 w-px bg-border"></div>
                            <div className="flex flex-col items-start">
                              <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm">{mp.ongoing_works || 0}</span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ongoing</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Badge variant={mp.risk_score >= 75 ? "highRisk" : mp.risk_score >= 50 ? "mediumRisk" : "lowRisk"} animated={mp.risk_score >= 75}>
                            {mp.risk_score.toFixed(1)}
                          </Badge>
                        </td>
                      </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-card">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{Math.min((page - 1) * limit + 1, total)}</span> to <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-medium text-foreground">{total}</span> results
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-sm font-medium px-2 text-foreground">
              {page} <span className="text-muted-foreground font-normal">/ {totalPages || 1}</span>
            </div>
            <button 
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || totalPages === 0 || loading}
              className="p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
