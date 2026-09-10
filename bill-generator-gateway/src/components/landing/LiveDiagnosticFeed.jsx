import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Layers, 
  ShieldCheck, 
  Filter
} from 'lucide-react';

const LiveDiagnosticFeed = ({ recentActivity = [] }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const scrollRef = useRef(null);

  // Default baseline operational logs (strictly non-financial)
  const baselineLogs = [
    { id: 1, type: 'SYSTEM', code: 'SYS_INIT', msg: 'Postgres connection active. Schema migration v2.4 verified.', time: '10:00:12.104' },
    { id: 2, type: 'WORK_ORDER', code: 'ENTRY_LOCK', msg: 'Work Order #2024-192 registered: ONGC Western Asset Auditorium.', time: '10:04:45.321' },
    { id: 3, type: 'CREW', code: 'ROSTER_SYNC', msg: 'Three-Camera Rig auto-allocated 5 crew roles: 1 Mixer, 3 CamOps, 1 Asst.', time: '10:05:02.890' },
    { id: 4, type: 'INVOICE', code: 'DOC_COMPILED', msg: 'Vendor Invoice #ONGC-2024-089 validated against company contract rates.', time: '10:12:18.441' },
    { id: 5, type: 'CREW', code: 'SETTLEMENT', msg: 'Selective batch payout settled for Manohar S. (Mixer Operator).', time: '10:18:33.209' },
    { id: 6, type: 'SYSTEM', code: 'RATE_HASH', msg: 'Custom work item pricing calculated and locked. Checksum valid.', time: '10:24:50.012' },
    { id: 7, type: 'INVOICE', code: 'PDF_RENDER', msg: 'Vector PDF invoice compiled with digital audit verification stamp.', time: '10:31:04.774' },
    { id: 8, type: 'CREW', code: 'LOGISTICS', msg: 'Event travel, food, and stay allowances updated for Work Order #2024-188.', time: '10:39:22.518' },
  ];

  // Merge with real recent activity if provided, sanitizing any monetary values
  const [logs, setLogs] = useState(() => {
    if (recentActivity && recentActivity.length > 0) {
      const sanitizedRealLogs = recentActivity.slice(0, 8).map((act, index) => {
        const isInvoice = act.type === 'payment_received';
        const code = isInvoice ? 'INVOICE_CLEAR' : 'CREW_DISBURSED';
        const type = isInvoice ? 'INVOICE' : 'CREW';
        // Strip out any currency amounts from description
        const cleanDesc = (act.description || act.title || 'Operational event recorded')
          .replace(/[₹$][\d,.]+/g, '')
          .replace(/Amount\s*:\s*[\d,.]+/gi, '');

        return {
          id: `real-${index}`,
          type,
          code,
          msg: `${act.title}: ${cleanDesc}`,
          time: act.date ? new Date(act.date).toLocaleTimeString('en-GB') : `10:4${index}:00`
        };
      });
      return [...sanitizedRealLogs, ...baselineLogs];
    }
    return baselineLogs;
  });

  // Simulated live telemetry push
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const liveEvents = [
        { type: 'WORK_ORDER', code: 'SCOPE_CHECK', msg: 'Work Order schedule verified against venue calendar.' },
        { type: 'CREW', code: 'MEMBER_LOCK', msg: 'Camera Operator credentials confirmed for Two-Camera Setup.' },
        { type: 'INVOICE', code: 'TAX_LEDGER', msg: '18% GST and 3% TDS reverse deduction matrices synchronized.' },
        { type: 'SYSTEM', code: 'HEARTBEAT', msg: 'Telemetry stream nominal. Zero packet drops across 4 worker nodes.' },
        { type: 'CREW', code: 'BATCH_PREPARE', msg: 'Pending crew payout batch indexed for Event #2024-195.' },
      ];

      const chosen = liveEvents[Math.floor(Math.random() * liveEvents.length)];
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

      setLogs((prev) => {
        const next = [{ id: Date.now(), ...chosen, time: timeStr }, ...prev.slice(0, 19)];
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const filteredLogs = logs.filter((log) => {
    if (activeFilter === 'ALL') return true;
    return log.type === activeFilter;
  });

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl font-mono">
      {/* Terminal Window Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          {/* OS Window Chrome Dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>ops-telemetry@ledger-gateway: ~ /var/log/pipeline.stream</span>
          </span>
        </div>

        {/* Controls & Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 text-[10px]">
            {['ALL', 'WORK_ORDER', 'CREW', 'INVOICE', 'SYSTEM'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2 py-1 rounded transition-colors ${
                  activeFilter === filter
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 transition-colors"
            title={isPaused ? 'Resume live feed' : 'Pause feed'}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
            <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Body */}
      <div 
        ref={scrollRef}
        className="mt-4 h-64 overflow-y-auto space-y-2 pr-2 text-xs select-text scrollbar-thin"
      >
        {filteredLogs.map((log) => {
          let badgeClass = 'text-zinc-400 bg-zinc-900 border-zinc-800';
          if (log.type === 'WORK_ORDER') badgeClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
          if (log.type === 'CREW') badgeClass = 'text-violet-400 bg-violet-500/10 border-violet-500/20';
          if (log.type === 'INVOICE') badgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          if (log.type === 'SYSTEM') badgeClass = 'text-sky-400 bg-sky-500/10 border-sky-500/20';

          return (
            <div key={log.id} className="flex items-start gap-2.5 leading-relaxed hover:bg-zinc-900/40 p-1 rounded transition-colors">
              <span className="text-zinc-500 select-none text-[11px] shrink-0 font-mono">
                {log.time}
              </span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-mono shrink-0 uppercase ${badgeClass}`}>
                {log.code}
              </span>
              <span className="text-zinc-300 font-mono text-xs break-all">
                {log.msg}
              </span>
            </div>
          );
        })}

        {/* Live Active Terminal Prompt */}
        <div className="flex items-center gap-2 pt-2 text-zinc-500 text-xs">
          <span className="text-emerald-400 font-bold">&gt;</span>
          <span>ops.daemon listening on port 5000</span>
          <span className="terminal-cursor" />
        </div>
      </div>

      {/* Footer Health Bar */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>Stream Healthy • 0 Packet Loss</span>
        </div>
        <span>Buffer Size: 20 Logs</span>
      </div>
    </div>
  );
};

export default LiveDiagnosticFeed;
