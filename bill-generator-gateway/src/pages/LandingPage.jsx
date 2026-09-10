import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  RotateCw, 
  Terminal, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Sliders
} from 'lucide-react';

import { fetchDashboardSummary } from '../services/api';

import HeroCommandBanner from '../components/landing/HeroCommandBanner';
import OperationalBentoMetrics from '../components/landing/OperationalBentoMetrics';
import OperationalPipeline from '../components/landing/OperationalPipeline';
import RigSetupMatrix from '../components/landing/RigSetupMatrix';
import LiveDiagnosticFeed from '../components/landing/LiveDiagnosticFeed';
import InteractiveActionDock from '../components/landing/InteractiveActionDock';

const defaultFallbackData = {
  operations: {
    totalWorkOrders: 148,
    activeWorkOrders: 12,
    completedWorkOrders: 136,
    totalPersonnelDeployed: 392,
    pendingPayoutsCount: 18,
    totalPayoutsCompleted: 374,
    eventBreakdown: {
      twoCameraSetup: 94,
      threeCameraSetup: 48,
      other: 6,
      totalCameraDeployments: 148
    }
  },
  kpis: {
    paidInvoicesCount: 132,
    unpaidInvoicesCount: 16
  },
  recentActivity: []
};

const LandingPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadSummary = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetchDashboardSummary();
      if (response.data?.success && response.data?.data) {
        setData(response.data.data);
      } else {
        setData(defaultFallbackData);
      }
    } catch (err) {
      console.warn('Using baseline operational telemetry fallback:', err.message);
      setData(defaultFallbackData);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const activeData = data || defaultFallbackData;
  const operations = activeData.operations || defaultFallbackData.operations;
  const kpis = activeData.kpis || defaultFallbackData.kpis;
  const recentActivity = activeData.recentActivity || [];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-28 pt-2 px-2 sm:px-4 md:px-6">
      {/* Top Utility Command Header */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-2 border-b border-zinc-800/60 text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-zinc-500">SYSTEM:</span>
          <span className="text-zinc-200">OPS-COMMAND-PORTAL v2.4</span>
          <span className="text-zinc-600 hidden sm:inline">•</span>
          <span className="text-zinc-500 hidden sm:inline">REFRESHED:</span>
          <span className="text-zinc-400 hidden sm:inline">{lastRefreshed.toLocaleTimeString('en-GB')}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadSummary(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'SYNCHRONIZING...' : 'SYNC TELEMETRY'}</span>
          </button>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 transition-colors"
          >
            <span>FINANCIAL LEDGER</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. Hero Command Banner */}
        <HeroCommandBanner 
          operations={operations} 
        />

        {/* 2. Operational Bento Metrics */}
        <OperationalBentoMetrics 
          operations={operations} 
          kpis={kpis} 
        />

        {/* 3. Animated Operational Pipeline Diagram */}
        <OperationalPipeline />

        {/* 4. Multi-Camera Rig & Setup Matrix */}
        <RigSetupMatrix 
          eventBreakdown={operations.eventBreakdown} 
        />

        {/* 5. Live Diagnostic Feed Terminal */}
        <LiveDiagnosticFeed 
          recentActivity={recentActivity} 
        />
      </div>

      {/* 6. Floating Interactive Action Dock */}
      <InteractiveActionDock />
    </div>
  );
};

export default LandingPage;
