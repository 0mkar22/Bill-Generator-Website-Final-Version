import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  FileText, 
  CreditCard, 
  BarChart3, 
  LayoutDashboard, 
  ArrowUpRight,
  Layers,
  Activity
} from 'lucide-react';

const MinimalHero = ({ operations = {}, kpis = {} }) => {
  const totalEvents = operations.totalWorkOrders || 0;
  const totalCrew = operations.totalPersonnelDeployed || 0;
  const totalInvoices = (kpis.paidInvoicesCount || 0) + (kpis.unpaidInvoicesCount || 0);
  const totalRigs = operations.eventBreakdown?.totalCameraDeployments || totalEvents;

  const launchpadItems = [
    {
      title: 'New Data Entry',
      path: '/work-orders',
      icon: PlusCircle,
      accent: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      hoverGlow: 'group-hover:via-indigo-500/40',
      category: 'Work Orders',
      description: 'Log event logistics, camera rigs, crew assignments & PO credentials.'
    },
    {
      title: 'Generate Invoice',
      path: '/invoices',
      icon: FileText,
      accent: 'text-sky-400',
      badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      hoverGlow: 'group-hover:via-sky-500/40',
      category: 'Invoicing',
      description: 'Compile tender-compliant ONGC vendor bills with digital stamp.'
    },
    {
      title: 'Pay Expenses',
      path: '/amount-paid',
      icon: CreditCard,
      accent: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      hoverGlow: 'group-hover:via-emerald-500/40',
      category: 'Disbursements',
      description: 'Disburse batch personnel payouts, travel, food & stay allowances.'
    },
    {
      title: 'View Reports',
      path: '/reports',
      icon: BarChart3,
      accent: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      hoverGlow: 'group-hover:via-amber-500/40',
      category: 'Audits & Exports',
      description: 'Review event operations summaries, technical rosters & data exports.'
    },
    {
      title: 'Executive Financials',
      path: '/dashboard',
      icon: LayoutDashboard,
      accent: 'text-violet-400',
      badgeBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      hoverGlow: 'group-hover:via-violet-500/40',
      category: 'Financial Ledger',
      description: 'Access executive revenue metrics, tax deductions & operating margins.'
    },
  ];

  return (
    <div className="pt-6 pb-12 animate-fade-in">
      {/* Main Headline & Subtitle */}
      <div className="max-w-3xl">
        <h1 className="font-brand text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
          <span className="bg-gradient-to-r from-red-400 via-zinc-100 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(99,102,241,0.28)]">
            Icomp Systems
          </span>
        </h1>

        <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-[2.2rem] font-bold tracking-tight text-zinc-200 leading-tight">
          Event Operations <span className="text-zinc-500 font-light">&amp;</span> Invoicing
        </h2>

        <p className="mt-4 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl font-normal">
          Coordinate multi-camera broadcasting setup, manage technical crew rosters, 
          and generate invoices with full audit readiness.
        </p>
      </div>

      {/* 5-Card Interactive Launchpad Grid */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Launchpad Operations</span>
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">5 Direct Modules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {launchpadItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{ 
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: 'backwards'
                }}
                className="group relative rounded-2xl border border-white/[0.07] bg-zinc-900/40 p-5 sm:p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700/80 hover:bg-zinc-900/70 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between overflow-hidden animate-slide-up"
              >
                {/* Subtle top edge glow on hover */}
                <div className={`absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] ${item.hoverGlow} to-transparent transition-all duration-500`} />

                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="p-2.5 rounded-xl border border-white/[0.06] bg-zinc-800/60 group-hover:bg-zinc-800/90 group-hover:border-white/[0.12] transition-all duration-200">
                      <Icon className={`w-4 h-4 ${item.accent} transition-transform duration-200 group-hover:scale-110`} />
                    </div>
                    <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-md border font-medium ${item.badgeBg}`}>
                      {item.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-zinc-100 text-base group-hover:text-white transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/[0.05] flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors duration-200">
                  <span className="font-mono text-[11px] font-medium">Open Module</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MinimalHero;
