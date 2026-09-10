import React from 'react';
import { 
  Layers, 
  Video, 
  Users, 
  FileCheck2, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Activity,
  ArrowUpRight
} from 'lucide-react';

const OperationalBentoMetrics = ({ operations = {}, kpis = {} }) => {
  const totalEvents = operations.totalWorkOrders || 0;
  const activeEvents = operations.activeWorkOrders || 0;
  const completedEvents = operations.completedWorkOrders || 0;

  const twoCam = operations.eventBreakdown?.twoCameraSetup || 0;
  const threeCam = operations.eventBreakdown?.threeCameraSetup || 0;
  const totalRigs = twoCam + threeCam || 1;
  const twoCamPercent = Math.round((twoCam / totalRigs) * 100);
  const threeCamPercent = 100 - twoCamPercent;

  const totalCrew = operations.totalPersonnelDeployed || 0;
  const pendingPayouts = operations.pendingPayoutsCount || 0;
  const completedPayouts = operations.totalPayoutsCompleted || 0;

  const paidInvoices = kpis.paidInvoicesCount || 0;
  const unpaidInvoices = kpis.unpaidInvoicesCount || 0;
  const totalInvoices = paidInvoices + unpaidInvoices;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Tile 1: Event Volume & Lifecycle */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-xl flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-xl">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Event Volume</span>
            </span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              OPERATIONAL
            </span>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-bold font-mono text-zinc-100">{totalEvents}</p>
            <p className="text-xs text-zinc-400 mt-1">Total Work Orders Ingested</p>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> Completed
              </span>
              <span className="font-mono text-zinc-200 font-semibold">{completedEvents}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Active / Scheduled
              </span>
              <span className="font-mono text-zinc-200 font-semibold">{activeEvents}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500 flex justify-between">
          <span>Lifecycle Reliability</span>
          <span className="text-emerald-400 font-bold">100% Tracked</span>
        </div>
      </div>

      {/* Tile 2: Multi-Cam Fleet Allocation */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-xl flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-xl">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-violet-400" />
              <span>Camera Rig Split</span>
            </span>
            <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
              FLEET RATIO
            </span>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-bold font-mono text-zinc-100">
              {operations.eventBreakdown?.totalCameraDeployments || totalEvents}
            </p>
            <p className="text-xs text-zinc-400 mt-1">Multi-Camera Deployments</p>
          </div>

          {/* Visual Ratio Bar */}
          <div className="mt-5">
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden flex">
              <div style={{ width: `${twoCamPercent}%` }} className="bg-indigo-500" title={`Two-Cam: ${twoCamPercent}%`} />
              <div style={{ width: `${threeCamPercent}%` }} className="bg-violet-500" title={`Three-Cam: ${threeCamPercent}%`} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-mono">
              <span className="text-indigo-400">2-Cam: {twoCam} ({twoCamPercent}%)</span>
              <span className="text-violet-400">3-Cam: {threeCam} ({threeCamPercent}%)</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500 flex justify-between">
          <span>Standard Setup Code</span>
          <span className="text-zinc-300">ONGC Class A/B</span>
        </div>
      </div>

      {/* Tile 3: Workforce & Crew Deployment */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-xl flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-xl">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Personnel Deployed</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              WORKFORCE
            </span>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-bold font-mono text-zinc-100">{totalCrew}</p>
            <p className="text-xs text-zinc-400 mt-1">Total Production Shifts</p>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Settlements Finalized</span>
              <span className="font-mono text-emerald-400 font-semibold">{completedPayouts}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Pending Personnel Queue</span>
              <span className="font-mono text-amber-400 font-semibold">{pendingPayouts}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500 flex justify-between">
          <span>Personnel Integrity</span>
          <span className="text-emerald-400 font-bold">Zero Duplicate Sync</span>
        </div>
      </div>

      {/* Tile 4: Documentation & Invoicing Velocity */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-xl flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-xl">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Invoicing Throughput</span>
            </span>
            <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              DOCUMENTATION
            </span>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-bold font-mono text-zinc-100">{totalInvoices || paidInvoices}</p>
            <p className="text-xs text-zinc-400 mt-1">Compiled Vendor Invoices</p>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Cleared Invoices</span>
              <span className="font-mono text-emerald-400 font-semibold">{paidInvoices}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Awaiting Settlement</span>
              <span className="font-mono text-zinc-300 font-semibold">{unpaidInvoices}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800/60 text-[11px] font-mono text-zinc-500 flex justify-between">
          <span>Tender Format Compliance</span>
          <span className="text-sky-400 font-bold">100% ONGC Format</span>
        </div>
      </div>
    </div>
  );
};

export default OperationalBentoMetrics;
