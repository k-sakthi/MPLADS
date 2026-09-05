"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function NotificationBell() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/alerts?status=OPEN&limit=5");
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // 1m poll
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <Bell className="w-4 h-4" />
        {alerts.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-background" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="p-3 border-b border-border bg-muted/30">
              <h3 className="text-sm font-semibold text-foreground">Recent Alerts</h3>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new alerts
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {alerts.map((alert) => (
                    <li key={alert.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          alert.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-500' :
                          alert.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {alert.priority}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(alert.detected_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate">{alert.alert_type.replace('_', ' ')}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{alert.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-2 border-t border-border bg-muted/30 text-center">
              <Link 
                href="/alerts" 
                onClick={() => setIsOpen(false)}
                className="text-xs text-primary hover:underline font-medium"
              >
                View all alerts
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
