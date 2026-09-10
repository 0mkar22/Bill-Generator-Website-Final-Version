import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  FileText, 
  Users, 
  BarChart3, 
  LayoutDashboard,
  Command
} from 'lucide-react';

const InteractiveActionDock = () => {
  const navigate = useNavigate();

  const dockActions = [
    { label: 'Work Orders', path: '/work-orders', key: 'W', icon: PlusCircle, color: 'text-indigo-400 hover:text-indigo-300' },
    { label: 'Invoices', path: '/invoices', key: 'I', icon: FileText, color: 'text-sky-400 hover:text-sky-300' },
    { label: 'Payouts', path: '/amount-paid', key: 'P', icon: Users, color: 'text-emerald-400 hover:text-emerald-300' },
    { label: 'Reports', path: '/reports', key: 'R', icon: BarChart3, color: 'text-amber-400 hover:text-amber-300' },
    { label: 'Financials', path: '/dashboard', key: 'D', icon: LayoutDashboard, color: 'text-violet-400 hover:text-violet-300' },
  ];

  // Hotkey navigation listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
        return;
      }

      const key = e.key.toUpperCase();
      const matched = dockActions.find(act => act.key === key);
      if (matched && !e.ctrlKey && !e.metaKey && !e.altKey) {
        navigate(matched.path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="fixed bottom-6 left-1/2 md:left-[calc(50%+130px)] -translate-x-1/2 z-40 max-w-[calc(100vw-32px)]">
      <div className="flex items-center flex-nowrap gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-full border border-zinc-700/60 bg-zinc-900/90 backdrop-blur-2xl shadow-[0_12px_40px_-8px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
        <div className="hidden lg:flex items-center gap-1.5 pl-2 pr-3 mr-1 border-r border-zinc-800 text-zinc-500 text-xs font-mono select-none">
          <Command className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[11px] uppercase tracking-wider font-semibold">Hotkeys</span>
        </div>

        {dockActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-zinc-800/90 active:scale-95 transition-all text-xs font-medium text-zinc-300 hover:text-white whitespace-nowrap"
            >
              <Icon className={`w-4 h-4 ${action.color} transition-transform group-hover:scale-110 shrink-0`} />
              <span className="whitespace-nowrap">{action.label}</span>
              <kbd className="hidden sm:inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 group-hover:border-zinc-600 group-hover:text-zinc-200 shadow-sm shrink-0">
                {action.key}
              </kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveActionDock;
