"use client";
import { API_URL } from '@/lib/api';


import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCw, Briefcase, CheckCircle2, Loader2, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/MetricCard";
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
  if (amount == null) return "—";
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function WorksPage() {
  const router = useRouter();
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  
  // Table state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("RECOMMENDED_AMOUNT");
  const [sortDesc, setSortDesc] = useState(true);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch(`${API_URL}/api/analytics/works/summary`);
        if (res.ok) setSummary(await res.json());
      } catch(e) {
        console.error(e);
      }
    };
    fetchSummary();
  }, []);

  // Fetch Works List
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
      if (statusFilter) query.append("status", statusFilter);

      const res = await fetch(`${API_URL}/api/analytics/works?${query}`);
      if (res.ok) {
        const data = await res.json();
        setWorks(data.data || []);
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
  }, [page, limit, debouncedSearch, stateFilter, statusFilter, sortBy, sortDesc]);

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Works Intelligence</h1>
          <p className="text-muted-foreground max-w-2xl">
            Explore and analyze individual MPLADS work implementations across the nation.
          </p>
        </motion.div>
        
        <div className="flex items-center space-x-4 mt-6 md:mt-0">
          <div className="text-sm text-muted-foreground flex items-center">
            <span className="font-semibold text-foreground mr-1.5">{total.toLocaleString('en-IN')}</span> 
            Works found
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

      {/* Summary Analytics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Total Works Database" 
            value={summary.total_works.toLocaleString('en-IN')} 
            icon={Briefcase}
            delay={0.1}
          />
          <MetricCard 
            title="Completed Works" 
            value={summary.completed.toLocaleString('en-IN')} 
            icon={CheckCircle2}
            delay={0.2}
          />
          <MetricCard 
            title="Ongoing Works" 
            value={summary.ongoing.toLocaleString('en-IN')} 
            icon={Loader2}
            delay={0.3}
          />
          <MetricCard 
            title="Total Expenditure" 
            value={formatRs(summary.expenditure)} 
            icon={IndianRupee}
            delay={0.4}
            highlight
          />
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search works, MP names, or constituencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground shadow-sm"
          />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap gap-4">
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
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none bg-card border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm w-48"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="ongoing">Ongoing</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {(search || stateFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(""); setStateFilter(""); setStatusFilter(""); }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
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
                <th className="py-4 px-6 font-semibold min-w-[300px]">
                  Description
                </th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none" onClick={() => handleSort("MP_NAME")}>
                  <div className="flex items-center group-hover:text-foreground transition-colors">
                    MP / Location <SortIcon column="MP_NAME" />
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none" onClick={() => handleSort("RECOMMENDED_AMOUNT")}>
                  <div className="flex items-center justify-end group-hover:text-foreground transition-colors">
                    Recommended <SortIcon column="RECOMMENDED_AMOUNT" />
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none" onClick={() => handleSort("SANCTION_AMOUNT")}>
                  <div className="flex items-center justify-end group-hover:text-foreground transition-colors">
                    Sanctioned <SortIcon column="SANCTION_AMOUNT" />
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none" onClick={() => handleSort("FUND_DISBURSED_AMT")}>
                  <div className="flex items-center justify-end group-hover:text-foreground transition-colors">
                    Expenditure <SortIcon column="FUND_DISBURSED_AMT" />
                  </div>
                </th>
                <th className="py-4 px-6 font-semibold text-center">Status</th>
                <th className="py-4 px-6 font-semibold cursor-pointer group select-none text-right" onClick={() => handleSort("risk_score")}>
                  <div className="flex items-center justify-end group-hover:text-foreground transition-colors">
                    MP Risk <SortIcon column="risk_score" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-card/20">
                    <td className="py-5 px-6"><div className="h-4 bg-muted rounded w-full max-w-md"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-muted rounded w-32"></div></td>
                    <td className="py-5 px-6 flex justify-end"><div className="h-4 bg-muted rounded w-20"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-muted rounded w-20 ml-auto"></div></td>
                    <td className="py-5 px-6"><div className="h-4 bg-muted rounded w-20 ml-auto"></div></td>
                    <td className="py-5 px-6"><div className="h-5 bg-muted rounded-full w-16 mx-auto"></div></td>
                    <td className="py-5 px-6"><div className="h-5 bg-muted rounded-full w-12 ml-auto"></div></td>
                  </tr>
                ))
              ) : works.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <SlidersHorizontal className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-foreground font-medium">No works found</p>
                    <p className="text-muted-foreground text-sm mt-1">Adjust your filters to see results.</p>
                  </td>
                </tr>
              ) : (
                works.map((work, i) => {
                  const isCompleted = (work.ACTUAL_AMOUNT || 0) > 0;
                  
                  return (
                      <tr key={i} onClick={() => router.push(`/works/${encodeURIComponent(work.WORK_RECOMMENDATION_DTL_ID)}`)} className="hover:bg-muted/60 transition-colors cursor-pointer group">
                        <td className="py-4 px-6 whitespace-normal min-w-[300px]">
                          <div className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-relaxed">
                            {work.WORK_DESCRIPTION || '—'}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider truncate max-w-sm">
                            {work.WORK_CATEGORY || '—'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <div className="font-medium text-foreground">{work.MP_NAME || '—'}</div>
                          <div className="text-muted-foreground text-xs">{work.CONSTITUENCY}, {work.STATE_NAME}</div>
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-muted-foreground text-right">
                          {formatRs(work.RECOMMENDED_AMOUNT)}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-muted-foreground text-right">
                          {formatRs(work.SANCTION_AMOUNT)}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-foreground font-medium text-right">
                          {formatRs(work.FUND_DISBURSED_AMT)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <Badge variant={isCompleted ? "lowRisk" : "outline"} className={isCompleted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground"}>
                            {isCompleted ? "Completed" : "Ongoing"}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Badge variant={work.risk_score >= 75 ? "highRisk" : work.risk_score >= 50 ? "mediumRisk" : "lowRisk"} animated={work.risk_score >= 75}>
                            {work.risk_score.toFixed(1)}
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
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-card overflow-hidden">
          <div className="text-sm text-muted-foreground truncate mr-4">
            Showing <span className="font-medium text-foreground">{total === 0 ? 0 : Math.min((page - 1) * limit + 1, total)}</span> to <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-medium text-foreground">{total}</span> works
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
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
