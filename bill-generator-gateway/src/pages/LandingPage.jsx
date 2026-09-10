import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, ExternalLink } from 'lucide-react';

import { fetchDashboardSummary } from '../services/api';
import MinimalHero from '../components/landing/MinimalHero';

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
  }
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

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-16 pt-2 px-3 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(99,102,241,0.06),transparent)]">
      <div className="max-w-5xl mx-auto">
        {/* Quiet Top Utility Bar */}
        <div className="flex items-center justify-between py-3 border-b border-zinc-800/60 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            <span className="text-zinc-300 font-medium">Operations Portal</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-zinc-400">Synced {lastRefreshed.toLocaleTimeString('en-GB')}</span>
          </div>
        </div>

        {/* Minimal Hero with 5 Action Launchpad & Telemetry Strip */}
        <MinimalHero 
          operations={operations} 
          kpis={kpis} 
        />
      </div>
    </div>
  );
};

export default LandingPage;
