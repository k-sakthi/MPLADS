"use client";

import React, { useState, useEffect } from "react";
import { IndiaMap } from "@/components/geography/IndiaMap";
import { StateRankingTable } from "@/components/geography/StateRankingTable";
import { ConstituencyDrilldown } from "@/components/geography/ConstituencyDrilldown";
import { ChevronLeft } from "lucide-react";

export function GeographyClient({ states }: { states: any[] }) {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  if (selectedState) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedState(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to National View
        </button>
        
        <h2 className="text-2xl font-bold text-foreground">
          {selectedState} <span className="text-muted-foreground font-normal">Constituency Intelligence</span>
        </h2>
        
        <ConstituencyDrilldown stateName={selectedState} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold px-1">National Distribution Map</h2>
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[600px] flex items-center justify-center p-4">
          <IndiaMap statesData={states} onStateClick={(stateName) => setSelectedState(stateName)} />
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold px-1">State Intelligence Ranking</h2>
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-[600px] flex flex-col">
          <StateRankingTable initialStates={states} onStateClick={(stateName) => setSelectedState(stateName)} />
        </div>
      </div>
    </div>
  );
}
