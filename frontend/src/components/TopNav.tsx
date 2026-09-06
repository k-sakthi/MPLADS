"use client";

import React, { useEffect, useState } from "react";
import { Search, Clock, RefreshCw, CheckCircle2, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import { useTheme } from "next-themes";

export function TopNav() {
  const pathname = usePathname();
  const [status, setStatus] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/data/status', {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (e) {
        // ignore for topnav
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (pathname) {
      case "/": return "National Overview";
      case "/mps": return "MP Intelligence Monitoring";
      default: return "Dashboard";
    }
  };

  const formatLastSync = (dateString: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const isLive = status?.data_source_status === "Source Connected";

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-foreground">{getPageTitle()}</h2>
      </div>

      <div className="flex items-center space-x-6">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search intelligence database..."
            className="w-64 bg-background/50 border border-border rounded-full pl-10 pr-4 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {/* Data Status Indicator */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex flex-col items-end mr-2">
            <span className="text-muted-foreground font-medium tracking-wide uppercase text-[10px]">Data Source</span>
            <span className="text-foreground">Official MPLADS eSAKSHI</span>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full border ${isLive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
            {isLive ? <CheckCircle2 className="w-3 h-3 mr-1.5" /> : <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />}
            {isLive ? 'Live Connection' : 'Syncing / Error'}
          </div>
        </div>

        {/* Last Sync */}
        <div className="flex items-center text-xs text-muted-foreground border-l border-border pl-6 hidden lg:flex">
          <Clock className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
          <span>Sync: {formatLastSync(status?.last_successful_refresh)}</span>
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* Notifications */}
        <NotificationBell />
      </div>
    </header>
  );
}