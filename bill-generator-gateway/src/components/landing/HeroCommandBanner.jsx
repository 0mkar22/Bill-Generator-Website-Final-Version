import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Layers, 
  FileText, 
  Users, 
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles,
  Server
} from 'lucide-react';

const HeroCommandBanner = ({ operations = {} }) => {
  const statusBadges = [
    { label: 'Postgres Database', value: 'Connected', icon: Server },
    { label: 'Worker Nodes', value: '3 Active Rigs', icon: Layers },
    { label: 'Crew Matching', value: 'Autonomous v2.4', icon: Users },
    { label: 'ONGC Spec', value: 'Compliant Format', icon: ShieldCheck },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-2xl">
      {/* Background ambient decorative glow */}
      <div 
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-indigo-500/10 blur-3xl rounded-full"
        aria-hidden="true" 
      />
      <div 
        className="pointer-events-none absolute -bottom-24 right-10 w-72 h-48 bg-violet-500/10 blur-3xl rounded-full"
        aria-hidden="true" 
      />

      {/* Top Status Ribbon */}
      <div className="flex flex-wrap items-center gap-2.5 pb-6 border-b border-zinc-800/60">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono uppercase tracking-wider text-[10px]">Operations Engine Live</span>
        </div>

        {statusBadges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div 
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-700 transition-colors"
            >
              <Icon className="w-3 h-3 text-zinc-500" />
              <span className="text-zinc-500">{badge.label}:</span>
              <span className="font-mono text-zinc-300 font-medium">{badge.value}</span>
            </div>
          );
        })}
      </div>

      {/* Hero Headline & Platform Summary */}
      <div className="pt-8 pb-6 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>MISSION-CRITICAL EVENT BILLING &amp; CREW ORCHESTRATION</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-100 leading-[1.12]">
          Enterprise Event Orchestration &amp;{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
            Invoice Engine
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-3xl">
          Unified control surface for multi-camera broadcasting and corporate event logistics. 
          Seamlessly compile entry-bound work orders, auto-map specialized technical crew rosters, 
          and generate tender-compliant vendor invoices with digital audit trails.
        </p>

        {/* Quick Action Navigation Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/work-orders"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-3 text-sm transition-all duration-200 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Layers className="w-4 h-4" />
            <span>Create Work Order</span>
            <ArrowUpRight className="w-4 h-4 ml-1 opacity-70" />
          </Link>

          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 font-medium px-5 py-3 text-sm transition-all duration-200 hover:border-zinc-600 hover:-translate-y-0.5 active:translate-y-0"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Generate Invoices</span>
            <ArrowUpRight className="w-4 h-4 ml-1 opacity-70" />
          </Link>

          <Link
            to="/amount-paid"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-300 font-medium px-5 py-3 text-sm transition-all duration-200 hover:border-zinc-700 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Crew Settlements</span>
            <ArrowUpRight className="w-4 h-4 ml-1 opacity-70" />
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 font-medium px-4 py-3 text-sm transition-all duration-200 hover:border-zinc-700"
          >
            <Activity className="w-4 h-4 text-violet-400" />
            <span>Executive Analytics ➔</span>
          </Link>
        </div>
      </div>

      {/* Operational Highlights Quick Counter Strip (Zero Financials) */}
      <div className="mt-6 pt-6 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Total Events Logged</p>
          <p className="mt-1 font-mono text-2xl font-bold text-zinc-100">
            {operations.totalWorkOrders ?? '0'}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Crew Deployed Shifts</p>
          <p className="mt-1 font-mono text-2xl font-bold text-indigo-400">
            {operations.totalPersonnelDeployed ?? '0'}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Multi-Cam Rigs Active</p>
          <p className="mt-1 font-mono text-2xl font-bold text-violet-400">
            {operations.eventBreakdown?.totalCameraDeployments ?? '0'}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-zinc-500">Settlement Verification</p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">
            {operations.totalPayoutsCompleted ?? '0'} <span className="text-xs font-normal text-zinc-500">completed</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroCommandBanner;
