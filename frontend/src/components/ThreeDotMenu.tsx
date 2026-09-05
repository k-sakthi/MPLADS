"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, RefreshCw, Maximize, Settings, FileText, Database, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ThreeDotMenuProps {
  onRefresh?: () => void;
  isSyncing?: boolean;
}

export function ThreeDotMenu({ onRefresh, isSyncing }: ThreeDotMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          isOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-2xl py-1 z-50 origin-top-right"
          >
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-semibold text-foreground">Dashboard Actions</p>
            </div>
            
            <div className="px-1 space-y-0.5">
              <Link 
                href="/system-status"
                onClick={() => setIsOpen(false)}
                className="w-full text-left flex items-center px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Activity className="w-3.5 h-3.5 mr-2" />
                System Status
              </Link>
              
              <Link 
                href="/data-sources"
                onClick={() => setIsOpen(false)}
                className="w-full text-left flex items-center px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Database className="w-3.5 h-3.5 mr-2" />
                Data Sources
              </Link>

              <Link 
                href="/reports"
                onClick={() => setIsOpen(false)}
                className="w-full text-left flex items-center px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <FileText className="w-3.5 h-3.5 mr-2" />
                Reports
              </Link>

              <button 
                onClick={toggleFullscreen}
                className="w-full text-left flex items-center px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Maximize className="w-3.5 h-3.5 mr-2" />
                Fullscreen
              </button>
              
              <button 
                onClick={() => {
                  if (onRefresh) onRefresh();
                  setIsOpen(false);
                }}
                disabled={isSyncing}
                className="w-full text-left flex items-center px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
