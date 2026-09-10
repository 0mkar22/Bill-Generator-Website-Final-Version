import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  FileCheck, 
  FileSpreadsheet, 
  CheckCircle2, 
  Workflow, 
  Layers, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

const OperationalPipeline = () => {
  const [activeStage, setActiveStage] = useState(1);

  const stages = [
    {
      id: 1,
      title: 'Event Creation',
      badge: 'ENTRY INGESTION',
      icon: Calendar,
      description: 'Ingests client contract, PO number, venue logistics, and scheduled broadcasting dates.',
      specs: ['Parent Entry ID Auto-Gen', 'PO Number Validation', 'Schedule Timeframe Lock'],
      metrics: 'Standard Time: < 30s'
    },
    {
      id: 2,
      title: 'Dynamic Crew Mapping',
      badge: 'ROLE ENFORCEMENT',
      icon: Users,
      description: 'Auto-maps certified crew roster based on selected Two-Camera or Three-Camera rig setup.',
      specs: ['Mixer Operator Allocation', 'Camera Ops (2 or 3)', 'Production Assistant Sync'],
      metrics: 'Zero Duplicate Assign'
    },
    {
      id: 3,
      title: 'Work Order Compilation',
      badge: 'RATE CARD BINDING',
      icon: FileCheck,
      description: 'Binds agreed contract work rates, multi-cam duration categories, and travel/food allowances.',
      specs: ['Custom Rate Harmonization', 'Travel/Stay Accounting', 'Unique Item Hash ID'],
      metrics: 'Tender Spec Verified'
    },
    {
      id: 4,
      title: 'Invoice Generation',
      badge: 'AUDIT COMPLIANCE',
      icon: FileSpreadsheet,
      description: 'Compiles print-ready ONGC Vendor Invoices with digital verification signatures and PDF rendering.',
      specs: ['Reverse 18% Tax Ledger', '3% Retention Accounting', 'Instant Vector PDF Render'],
      metrics: 'Dispute-Free Output'
    }
  ];

  return (
    <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/60">
        <div>
          <div className="inline-flex items-center gap-1.5 text-indigo-400 text-xs font-mono font-medium mb-1">
            <Workflow className="w-3.5 h-3.5" />
            <span>ARCHITECTURE FLOW</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
            Animated Operational Pipeline
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Deterministic 4-stage pipeline connecting initial event capture to verified tender documentation.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-xs text-zinc-400 font-mono self-start sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Continuous Execution Protocol</span>
        </div>
      </div>

      {/* SVG Connecting Flow Lines (visible on md+ screens) */}
      <div className="relative mt-8">
        <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-6 pointer-events-none z-0">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <line 
              x1="0%" 
              y1="50%" 
              x2="100%" 
              y2="50%" 
              stroke="rgba(99, 102, 241, 0.4)" 
              strokeWidth="2" 
              className="pipeline-data-stream" 
            />
          </svg>
        </div>

        {/* Pipeline Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isSelected = activeStage === stage.id;

            return (
              <div
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`cursor-pointer rounded-xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500/80 bg-zinc-900/90 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/50'
                }`}
              >
                <div>
                  {/* Card Top: Stage Number & Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono font-bold text-indigo-400">
                      0{stage.id}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {stage.badge}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-zinc-100 text-base">
                      {stage.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {stage.description}
                  </p>

                  {/* Specifications List */}
                  <div className="space-y-1.5 pt-3 border-t border-zinc-800/60">
                    {stage.specs.map((spec, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2 text-[11px] text-zinc-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Metric */}
                <div className="mt-4 pt-3 border-t border-zinc-800/40 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Standard:</span>
                  <span className="text-indigo-300 font-medium">{stage.metrics}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Stage Deep-Dive Info Drawer */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-mono text-zinc-400">
              ACTIVE STAGE AUDIT: <span className="text-indigo-400 font-semibold">{stages[activeStage - 1].title}</span>
            </p>
            <p className="text-xs text-zinc-300 mt-0.5">
              Deterministic state verification guarantees data integrity across every document lifecycle step.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-zinc-500">Step {activeStage} of 4</span>
          <button
            onClick={() => setActiveStage((prev) => (prev % 4) + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 px-3 py-1.5 text-xs text-zinc-200 font-medium transition-colors"
          >
            <span>Next Stage</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationalPipeline;
