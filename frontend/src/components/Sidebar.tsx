"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  IndianRupee, 
  ShieldAlert, 
  Map, 
  AlertTriangle, 
  Database,
  Activity,
  Brain,
  Bell,
  ShieldCheck,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Geography", href: "/geography", icon: Map },
  { name: "MP Monitoring", href: "/mps", icon: Users },
  { name: "Works", href: "/works", icon: Briefcase },
  { name: "Expenditure Intelligence", href: "/expenditure", icon: IndianRupee },
  { name: "AI Intelligence", href: "/intelligence", icon: Brain },
  { name: "Alerts Center", href: "/alerts", icon: Bell },
  { name: "Audit & Compliance", href: "/audit", icon: ShieldCheck },
  { name: "Reporting", href: "/reports", icon: FileText },
  { name: "Calamity", href: "/calamity", icon: AlertTriangle, disabled: false },
];

const bottomItems = [
  { name: "Data Sources", href: "/data-sources", icon: Database, disabled: false },
  { name: "System Status", href: "/system-status", icon: Activity, disabled: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside className={`border-r border-border bg-card/80 backdrop-blur-xl flex flex-col h-full sticky top-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-6 relative">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-card border border-border rounded-full p-1 shadow-md hover:bg-muted transition-colors z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div className={`flex items-center space-x-3 mb-1 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 min-w-[40px] bg-white rounded-full flex items-center justify-center shadow-md p-1 border border-border">
            <img src="/ashoka-lion.svg" alt="Ashoka Lion Capital" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-xs font-bold tracking-tight text-foreground uppercase whitespace-nowrap truncate">MPLADS Intelligence System</h1>
              <p className="text-[8px] text-muted-foreground uppercase tracking-widest whitespace-nowrap truncate">Monitor · Analyze · Ensure Impact</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
        <div className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pt-2 ${isCollapsed ? 'px-0 text-center text-[10px]' : 'px-2'}`}>
          {isCollapsed ? 'Ana' : 'Analytics'}
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.disabled ? "#" : item.href}
              className={`flex items-center space-x-3 py-2 rounded-lg text-sm transition-all relative group ${
                isCollapsed ? 'px-0 justify-center' : 'px-3'
              } ${
                item.disabled 
                  ? "opacity-50 cursor-not-allowed text-muted-foreground" 
                  : isActive 
                    ? "text-primary-foreground bg-primary font-medium shadow-md shadow-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary rounded-lg -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 transition-transform ${isActive ? "text-primary-foreground" : "group-hover:scale-110"}`} />
              {!isCollapsed && <span className="relative z-10">{item.name}</span>}
              {!isCollapsed && item.disabled && (
                <span className="ml-auto text-[9px] uppercase bg-muted-foreground/10 px-1.5 py-0.5 rounded text-muted-foreground">Soon</span>
              )}
            </Link>
          );
        })}

        <div className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pt-6 ${isCollapsed ? 'px-0 text-center text-[10px]' : 'px-2'}`}>
          {isCollapsed ? 'Sys' : 'System'}
        </div>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center space-x-3 py-2 rounded-lg text-sm transition-colors ${
                isCollapsed ? 'px-0 justify-center' : 'px-3'
              } text-muted-foreground hover:text-foreground hover:bg-muted`}
            >
              <Icon className="w-4 h-4" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}