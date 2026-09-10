import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Collapse
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BusinessIcon from '@mui/icons-material/Business';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { fetchDashboardSummary } from '../services/api';
import { DashboardSkeleton } from '../components/skeletons';

const glassCardStyle = {
  p: 3,
  backgroundColor: 'rgba(24, 24, 27, 0.50)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  borderRadius: '14px',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  transition: 'border-color 0.2s ease, transform 0.2s ease'
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all'); // 'all' | 'in' | 'out'
  const [revenueExpanded, setRevenueExpanded] = useState(false);
  const [expensesExpanded, setExpensesExpanded] = useState(false);

  const loadSummary = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await fetchDashboardSummary();
      if (response.data?.success && response.data?.data) {
        setData(response.data.data);
      } else {
        throw new Error(response.data?.error || 'Failed to parse dashboard data.');
      }
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Unable to connect to the analytics server. Please ensure the backend server is running.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // Filtered activity feed
  const filteredActivity = useMemo(() => {
    if (!data?.recentActivity) return [];
    if (activityFilter === 'in') {
      return data.recentActivity.filter((item) => item.type === 'payment_received');
    }
    if (activityFilter === 'out') {
      return data.recentActivity.filter((item) => item.type === 'payout_disbursed');
    }
    return data.recentActivity;
  }, [data, activityFilter]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const kpis = data?.kpis || {
    totalRevenue: 0,
    totalAmountReceived: 0,
    amountYetToPay: 0,
    totalGst: 0,
    totalRevenueExGst: 0,
    totalDisbursed: 0,
    expenseBreakdown: {
      crew: 0,
      travel: 0,
      food: 0,
      stay: 0,
      gst: 0,
      total: 0
    },
    netProfit: 0,
    profitMargin: 0,
    outstandingReceivables: 0,
    paidInvoicesCount: 0,
    unpaidInvoicesCount: 0
  };

  const operations = data?.operations || {
    totalWorkOrders: 0,
    activeWorkOrders: 0,
    completedWorkOrders: 0,
    totalPersonnelDeployed: 0,
    pendingPayoutsCount: 0,
    totalPayoutsCompleted: 0
  };

  const companyBreakdown = data?.companyBreakdown || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }} className="lumina-page-enter">
      {/* Top Header & Executive Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{
              width: 34,
              height: 34,
              borderRadius: '9px',
              bgcolor: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.30)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUpIcon sx={{ color: '#818cf8', fontSize: 20 }} />
            </Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.03em' }}>
              Executive Analytics
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
            Real-time revenue, crew payout disbursements, and event operations command center.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Live Sync Status */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            borderRadius: '20px',
            bgcolor: 'rgba(24, 24, 27, 0.60)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <Box sx={{ width: 8, height: 8, bgcolor: '#34d399' }} className="lumina-live-pulse" />
            <Typography sx={{ fontSize: '11px', fontFamily: '"JetBrains Mono", monospace', color: '#a1a1aa' }}>
              Live Ledger • Real-Time
            </Typography>
          </Box>

          <Tooltip title="Refresh metrics">
            <IconButton
              onClick={() => loadSummary(true)}
              disabled={refreshing}
              sx={{
                bgcolor: 'rgba(24, 24, 27, 0.60)',
                border: '1px solid rgba(255, 255, 255, 0.10)',
                color: '#f4f4f5',
                '&:hover': { bgcolor: 'rgba(39, 39, 42, 0.80)' }
              }}
            >
              <RefreshIcon sx={{
                fontSize: 18,
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="warning"
          sx={{
            mb: 4,
            bgcolor: 'rgba(245, 158, 11, 0.10)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: '#fbbf24',
            '& .MuiAlert-icon': { color: '#fbbf24' }
          }}
          action={
            <Button color="inherit" size="small" onClick={() => loadSummary(true)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* 4-Column Financial KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} alignItems="flex-start">
        {/* KPI 1: Total Revenue / Money Earned */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            ...glassCardStyle,
            '&:hover': { borderColor: 'rgba(52, 211, 153, 0.35)', transform: 'translateY(-2px)' }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Revenue
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={revenueExpanded ? 'Collapse breakdown' : 'Expand breakdown'}>
                  <IconButton
                    size="small"
                    onClick={() => setRevenueExpanded(prev => !prev)}
                    sx={{
                      width: 28,
                      height: 28,
                      color: revenueExpanded ? '#34d399' : '#a1a1aa',
                      bgcolor: revenueExpanded ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transform: revenueExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'all 0.2s ease',
                      '&:hover': { color: '#34d399', bgcolor: 'rgba(52, 211, 153, 0.15)' }
                    }}
                  >
                    <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AccountBalanceWalletIcon sx={{ color: '#34d399', fontSize: 18 }} />
                </Box>
              </Box>
            </Box>
            <Typography sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#34d399',
              lineHeight: 1.2,
              mb: 1.5
            }}>
              ₹{kpis.totalRevenue.toLocaleString('en-IN')}
            </Typography>

            {/* Expandable Dropdown Trigger Bar */}
            <Box
              onClick={() => setRevenueExpanded(prev => !prev)}
              role="button"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.25,
                py: 0.6,
                mb: 1,
                borderRadius: '6px',
                bgcolor: revenueExpanded ? 'rgba(52, 211, 153, 0.12)' : 'rgba(52, 211, 153, 0.06)',
                border: '1px solid rgba(52, 211, 153, 0.20)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.35)' }
              }}
            >
              <Typography sx={{ fontSize: '0.72rem', color: '#e4e4e7', fontWeight: 600 }}>
                {revenueExpanded ? 'Hide Breakdown' : 'Received & TDS and Other'}
              </Typography>
              <KeyboardArrowDownIcon sx={{
                fontSize: 16,
                color: '#34d399',
                transform: revenueExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} />
            </Box>

            {/* Extended Dropdown Cell Content */}
            <Collapse in={revenueExpanded}>
              <Box sx={{
                pt: 1,
                pb: 0.5,
                borderTop: '1px dashed rgba(255, 255, 255, 0.12)',
                mb: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75
              }}>
                {/* Amount Received */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.25,
                  py: 0.6,
                  borderRadius: '6px',
                  bgcolor: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.20)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#34d399' }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#e4e4e7', fontWeight: 500 }}>
                      Amount Received
                    </Typography>
                  </Box>
                  <Typography sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#34d399'
                  }}>
                    ₹{(kpis.totalAmountReceived ?? 0).toLocaleString('en-IN')}
                  </Typography>
                </Box>

                {/* TDS and Other */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.25,
                  py: 0.6,
                  borderRadius: '6px',
                  bgcolor: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.20)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#fbbf24' }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#e4e4e7', fontWeight: 500 }}>
                      TDS and Other
                    </Typography>
                  </Box>
                  <Typography sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#fbbf24'
                  }}>
                    ₹{(kpis.tdsAndOther ?? kpis.amountYetToPay ?? 0).toLocaleString('en-IN')}
                  </Typography>
                </Box>

                <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.68rem', textAlign: 'right', fontStyle: 'italic' }}>
                  Amount Received + TDS and Other = Total Revenue
                </Typography>
              </Box>
            </Collapse>

            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.75rem', display: 'block' }}>
              From {kpis.paidInvoicesCount} settled invoices
            </Typography>
          </Paper>
        </Grid>

        {/* KPI 2: Personnel Expenses / Disbursed */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            ...glassCardStyle,
            '&:hover': { borderColor: 'rgba(251, 113, 133, 0.35)', transform: 'translateY(-2px)' }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Expenses
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={expensesExpanded ? 'Collapse bifurcation' : 'Expand bifurcation'}>
                  <IconButton
                    size="small"
                    onClick={() => setExpensesExpanded(prev => !prev)}
                    sx={{
                      width: 28,
                      height: 28,
                      color: expensesExpanded ? '#fb7185' : '#a1a1aa',
                      bgcolor: expensesExpanded ? 'rgba(251, 113, 133, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transform: expensesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'all 0.2s ease',
                      '&:hover': { color: '#fb7185', bgcolor: 'rgba(251, 113, 133, 0.15)' }
                    }}
                  >
                    <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: 'rgba(251, 113, 133, 0.12)',
                  border: '1px solid rgba(251, 113, 133, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PaymentsIcon sx={{ color: '#fb7185', fontSize: 18 }} />
                </Box>
              </Box>
            </Box>
            <Typography sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#fb7185',
              lineHeight: 1.2,
              mb: 1.5
            }}>
              ₹{kpis.totalDisbursed.toLocaleString('en-IN')}
            </Typography>

            {/* Expandable Dropdown Trigger Bar */}
            <Box
              onClick={() => setExpensesExpanded(prev => !prev)}
              role="button"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 1.25,
                py: 0.6,
                mb: 1,
                borderRadius: '6px',
                bgcolor: expensesExpanded ? 'rgba(251, 113, 133, 0.12)' : 'rgba(251, 113, 133, 0.06)',
                border: '1px solid rgba(251, 113, 133, 0.20)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(251, 113, 133, 0.15)', borderColor: 'rgba(251, 113, 133, 0.35)' }
              }}
            >
              <Typography sx={{ fontSize: '0.72rem', color: '#e4e4e7', fontWeight: 600 }}>
                {expensesExpanded ? 'Hide Bifurcation' : 'Expense Bifurcation'}
              </Typography>
              <KeyboardArrowDownIcon sx={{
                fontSize: 16,
                color: '#fb7185',
                transform: expensesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} />
            </Box>

            {/* Extended Dropdown Cell Content */}
            <Collapse in={expensesExpanded}>
              <Box sx={{
                pt: 1,
                pb: 0.5,
                borderTop: '1px dashed rgba(255, 255, 255, 0.12)',
                mb: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75
              }}>
                {[
                  { label: 'Crew Wages', value: kpis.expenseBreakdown?.crew ?? kpis.totalDisbursed, color: '#fb7185' },
                  { label: 'Travel', value: kpis.expenseBreakdown?.travel ?? 0, color: '#38bdf8' },
                  { label: 'Food', value: kpis.expenseBreakdown?.food ?? 0, color: '#f59e0b' },
                  { label: 'Stay', value: kpis.expenseBreakdown?.stay ?? 0, color: '#a78bfa' },
                  { label: 'GST (18%)', value: kpis.expenseBreakdown?.gst ?? kpis.totalGst ?? 0, color: '#06b6d4' }
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1.25,
                      py: 0.5,
                      borderRadius: '6px',
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography sx={{ fontSize: '0.75rem', color: '#e4e4e7', fontWeight: 500 }}>
                        {item.label}
                      </Typography>
                    </Box>
                    <Typography sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: item.value > 0 ? item.color : '#71717a'
                    }}>
                      ₹{Number(item.value || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Collapse>

            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.75rem', display: 'block' }}>
              {operations.totalPayoutsCompleted} payouts disbursed to crew
            </Typography>
          </Paper>
        </Grid>

        {/* KPI 3: Net Operating Profit */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            ...glassCardStyle,
            '&:hover': { borderColor: 'rgba(129, 140, 248, 0.35)', transform: 'translateY(-2px)' }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Net Operating Profit
              </Typography>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: 'rgba(129, 140, 248, 0.12)',
                border: '1px solid rgba(129, 140, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUpIcon sx={{ color: '#818cf8', fontSize: 18 }} />
              </Box>
            </Box>
            <Typography sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: kpis.netProfit >= 0 ? '#818cf8' : '#fb7185',
              lineHeight: 1.2,
              mb: 1
            }}>
              ₹{kpis.netProfit.toLocaleString('en-IN')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{
                px: 1,
                py: 0.2,
                borderRadius: '4px',
                bgcolor: kpis.profitMargin >= 0 ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 113, 133, 0.15)',
                color: kpis.profitMargin >= 0 ? '#34d399' : '#fb7185',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.7rem',
                fontWeight: 600
              }}>
                {kpis.profitMargin >= 0 ? `+${kpis.profitMargin}%` : `${kpis.profitMargin}%`}
              </Box>
              <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.75rem' }}>
                Operating Margin
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem', display: 'block' }}>
              Amount Received − Expenses (incl. GST)
            </Typography>
          </Paper>
        </Grid>

        {/* KPI 4: Outstanding Receivables */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{
            ...glassCardStyle,
            '&:hover': { borderColor: 'rgba(251, 191, 36, 0.35)', transform: 'translateY(-2px)' }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Receivables (Unpaid)
              </Typography>
              <Box sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PendingActionsIcon sx={{ color: '#fbbf24', fontSize: 18 }} />
              </Box>
            </Box>
            <Typography sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#fbbf24',
              lineHeight: 1.2,
              mb: 1
            }}>
              ₹{kpis.outstandingReceivables.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.75rem', display: 'block' }}>
              From {kpis.unpaidInvoicesCount} pending invoices
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick-Action Shortcuts Bar */}
      <Paper sx={{ ...glassCardStyle, p: 2, mb: 4, bgcolor: 'rgba(24, 24, 27, 0.65)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#818cf8' }} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#e4e4e7', letterSpacing: '0.02em' }}>
              Quick Workflows
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate('/work-orders')}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.12)',
                color: '#f4f4f5',
                '&:hover': { borderColor: '#818cf8', bgcolor: 'rgba(99, 102, 241, 0.10)' }
              }}
            >
              New Work Order
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DescriptionIcon />}
              onClick={() => navigate('/invoices')}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.12)',
                color: '#f4f4f5',
                '&:hover': { borderColor: '#818cf8', bgcolor: 'rgba(99, 102, 241, 0.10)' }
              }}
            >
              Generate Invoice
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PaymentsIcon />}
              onClick={() => navigate('/amount-paid')}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.12)',
                color: '#f4f4f5',
                '&:hover': { borderColor: '#818cf8', bgcolor: 'rgba(99, 102, 241, 0.10)' }
              }}
            >
              Log Crew Payout
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/reports')}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.12)',
                color: '#f4f4f5',
                '&:hover': { borderColor: '#818cf8', bgcolor: 'rgba(99, 102, 241, 0.10)' }
              }}
            >
              Export Reports
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Split Section: Recent Activity on Left (7 cols), Operational Stats on Right (5 cols) */}
      <Grid container spacing={3}>
        {/* Left: Interleaved Financial Activity Feed */}
        <Grid item xs={12} lg={7}>
          <Paper sx={{ ...glassCardStyle, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f4f4f5', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Recent Financial Activity
                </Typography>
                <Typography variant="caption" sx={{ color: '#71717a' }}>
                  Real-time log of customer payments and crew disbursements
                </Typography>
              </Box>

              {/* Filter Pills */}
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                <Chip
                  label="All"
                  size="small"
                  onClick={() => setActivityFilter('all')}
                  sx={{
                    fontSize: '0.7rem',
                    fontFamily: '"JetBrains Mono", monospace',
                    bgcolor: activityFilter === 'all' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: activityFilter === 'all' ? '#818cf8' : '#a1a1aa',
                    border: activityFilter === 'all' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                />
                <Chip
                  label="Payments In"
                  size="small"
                  onClick={() => setActivityFilter('in')}
                  sx={{
                    fontSize: '0.7rem',
                    fontFamily: '"JetBrains Mono", monospace',
                    bgcolor: activityFilter === 'in' ? 'rgba(52, 211, 153, 0.20)' : 'rgba(255, 255, 255, 0.05)',
                    color: activityFilter === 'in' ? '#34d399' : '#a1a1aa',
                    border: activityFilter === 'in' ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                />
                <Chip
                  label="Payouts Out"
                  size="small"
                  onClick={() => setActivityFilter('out')}
                  sx={{
                    fontSize: '0.7rem',
                    fontFamily: '"JetBrains Mono", monospace',
                    bgcolor: activityFilter === 'out' ? 'rgba(251, 113, 133, 0.20)' : 'rgba(255, 255, 255, 0.05)',
                    color: activityFilter === 'out' ? '#fb7185' : '#a1a1aa',
                    border: activityFilter === 'out' ? '1px solid rgba(251, 113, 133, 0.4)' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                />
              </Box>
            </Box>

            {filteredActivity.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center', color: '#71717a' }}>
                <Typography variant="body2" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  No financial activity found for this filter.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, overflowY: 'auto' }}>
                {filteredActivity.map((item) => {
                  const isPayment = item.type === 'payment_received';
                  const dateFormatted = item.date
                    ? new Date(item.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <Box
                      key={item.id}
                      sx={{
                        p: 1.75,
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          borderColor: 'rgba(255, 255, 255, 0.12)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Box sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '8px',
                          bgcolor: isPayment ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)',
                          border: `1px solid ${isPayment ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 113, 133, 0.25)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isPayment ? (
                            <TrendingUpIcon sx={{ color: '#34d399', fontSize: 18 }} />
                          ) : (
                            <TrendingDownIcon sx={{ color: '#fb7185', fontSize: 18 }} />
                          )}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#f4f4f5',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.title}
                          </Typography>
                          <Typography sx={{
                            fontSize: '0.75rem',
                            color: '#a1a1aa',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.description}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography sx={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: isPayment ? '#34d399' : '#fb7185'
                        }}>
                          {isPayment ? `+₹${item.amount.toLocaleString('en-IN')}` : `-₹${item.amount.toLocaleString('en-IN')}`}
                        </Typography>
                        <Typography sx={{
                          fontSize: '0.7rem',
                          color: '#71717a',
                          fontFamily: '"JetBrains Mono", monospace'
                        }}>
                          {dateFormatted}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right: Operations & Workforce Analytics */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Work Order Fulfillment Ratio */}
            <Paper sx={glassCardStyle}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  bgcolor: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <EventNoteIcon sx={{ color: '#818cf8', fontSize: 18 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f4f4f5', fontSize: '0.95rem' }}>
                  Event Fulfillment
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#a1a1aa' }}>
                  Completed vs Active Orders
                </Typography>
                <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem', color: '#f4f4f5' }}>
                  {operations.completedWorkOrders} / {operations.totalWorkOrders}
                </Typography>
              </Box>

              {/* Progress bar */}
              <Box sx={{ width: '100%', height: 8, bgcolor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', mb: 3 }}>
                <Box sx={{
                  width: operations.totalWorkOrders > 0
                    ? `${Math.min(100, (operations.completedWorkOrders / operations.totalWorkOrders) * 100)}%`
                    : '0%',
                  height: '100%',
                  bgcolor: '#6366f1',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease'
                }} />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem' }}>
                      Active / Upcoming
                    </Typography>
                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.25rem', fontWeight: 700, color: '#f4f4f5' }}>
                      {operations.activeWorkOrders}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem' }}>
                      Archived / Past
                    </Typography>
                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>
                      {operations.completedWorkOrders}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Crew Deployment & Liability Health */}
            <Paper sx={glassCardStyle}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    bgcolor: 'rgba(251, 191, 36, 0.12)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PeopleIcon sx={{ color: '#fbbf24', fontSize: 18 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f4f4f5', fontSize: '0.95rem' }}>
                    Crew Deployment & Liabilities
                  </Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate('/amount-paid')}
                  sx={{
                    fontSize: '0.75rem',
                    color: '#818cf8',
                    textTransform: 'none',
                    p: 0,
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                  }}
                >
                  Settle
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{
                  p: 1.5,
                  borderRadius: '8px',
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.8rem', color: '#f4f4f5', fontWeight: 500 }}>
                      Total Crew Deployed
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#71717a' }}>
                      Across all logged event items
                    </Typography>
                  </Box>
                  <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '1.1rem', fontWeight: 700, color: '#f4f4f5' }}>
                    {operations.totalPersonnelDeployed}
                  </Typography>
                </Box>

                <Box sx={{
                  p: 1.5,
                  borderRadius: '8px',
                  bgcolor: operations.pendingPayoutsCount > 0 ? 'rgba(251, 191, 36, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${operations.pendingPayoutsCount > 0 ? 'rgba(251, 191, 36, 0.20)' : 'rgba(255, 255, 255, 0.06)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.8rem', color: operations.pendingPayoutsCount > 0 ? '#fbbf24' : '#f4f4f5', fontWeight: 500 }}>
                      Unsettled Crew Assignments
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#71717a' }}>
                      Crew awaiting payout recording
                    </Typography>
                  </Box>
                  <Typography sx={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: operations.pendingPayoutsCount > 0 ? '#fbbf24' : '#34d399'
                  }}>
                    {operations.pendingPayoutsCount}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Client Contribution Breakdown */}
            {companyBreakdown.length > 0 && (
              <Paper sx={glassCardStyle}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    bgcolor: 'rgba(52, 211, 153, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BusinessIcon sx={{ color: '#34d399', fontSize: 18 }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f4f4f5', fontSize: '0.95rem' }}>
                    Top Client Accounts
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {companyBreakdown.map((c) => (
                    <Box
                      key={c.companyName}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 0.75,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <Box sx={{ minWidth: 0, mr: 1 }}>
                        <Typography sx={{
                          fontSize: '0.8rem',
                          color: '#f4f4f5',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {c.companyName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#71717a', fontSize: '0.7rem' }}>
                          {c.invoiceCount} paid {c.invoiceCount === 1 ? 'invoice' : 'invoices'}
                        </Typography>
                      </Box>
                      <Typography sx={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#34d399',
                        flexShrink: 0
                      }}>
                        ₹{c.revenue.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardOverview;
