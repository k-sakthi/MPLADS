import React from "react";
import { AlertsClient } from "./AlertsClient";
import { Bell } from "lucide-react";

export const metadata = {
  title: "Alerts Center | MPLADS",
  description: "Centralized monitoring center for MPLADS situations requiring review",
};

async function fetchData(endpoint: string) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/alerts/${endpoint}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function AlertsPage() {
  const [summary, initialAlerts, categories, trends] = await Promise.all([
    fetchData("summary"),
    fetchData("?limit=50&offset=0"),
    fetchData("categories"),
    fetchData("trends")
  ]);

  return (
    <div className="flex-1 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <Bell className="w-8 h-8" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Alerts & Monitoring Center
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Centralized identification of MPLADS data patterns requiring analytical review.
        </p>
      </div>

      <AlertsClient 
        initialSummary={summary} 
        initialAlerts={initialAlerts} 
        categories={categories}
        trends={trends}
      />
    </div>
  );
}
