import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';

import { Container, Paper, Typography, TextField, Button, Box, CircularProgress, ThemeProvider } from '@mui/material';
import theme from './theme';

import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import DashboardOverview from './pages/DashboardOverview';
import WorkOrder from './pages/WorkOrder';
import Reports from './pages/Reports';
import WorkOrderInvoice from './pages/WorkOrderInvoice';
import VendorInvoice from './pages/VendorInvoice';
import InvoiceGenerator from './pages/InvoiceGenerator';
import AmountPaid from './pages/AmountPaid';
import { AppShellSkeleton } from './components/skeletons';

const LandingPage = React.lazy(() => import('./pages/LandingPage'));

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    setAuthLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Account created! Please check your email to verify.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    }
    setAuthLoading(false);
  };

  if (loading) {
    return <AppShellSkeleton />;
  }

  if (!session) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{
          minHeight: '100vh',
          bgcolor: '#09090b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          backgroundImage: 'radial-gradient(ellipse 800px 500px at 50% 0%, rgba(99, 102, 241, 0.15) 0%, rgba(9, 9, 11, 0) 70%)'
        }}>
          <Container maxWidth="xs">
            <Paper sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              bgcolor: 'rgba(24, 24, 27, 0.70)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle top spotlight */}
              <Box className="lumina-spotlight" sx={{
                position: 'absolute',
                top: -60,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 240,
                height: 120,
                bgcolor: 'rgba(99, 102, 241, 0.20)',
                filter: 'blur(40px)',
                pointerEvents: 'none',
                borderRadius: '50%'
              }} />

              <Box sx={{ textAlign: 'center', mb: 1, position: 'relative' }}>
                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1,
                  px: 2,
                  mb: 2,
                  borderRadius: '12px',
                  bgcolor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.20)'
                }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />
                  <Typography sx={{ fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, color: '#818cf8', letterSpacing: '0.05em' }}>
                    LUMINA LEDGER
                  </Typography>
                </Box>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
                  {isSignUp ? 'Create Account' : 'Sign in to Ledger'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#a1a1aa', mt: 0.5, fontSize: '0.85rem' }}>
                  {isSignUp ? 'Get started with event billing and automated invoices' : 'Enter your credentials to access your billing workspace'}
                </Typography>
              </Box>

              {message && (
                <Box sx={{
                  p: 1.5,
                  borderRadius: '8px',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  bgcolor: isSignUp && !message.includes('error') ? 'rgba(16, 185, 129, 0.10)' : 'rgba(244, 63, 94, 0.10)',
                  color: isSignUp && !message.includes('error') ? '#34d399' : '#fb7185',
                  border: `1px solid ${isSignUp && !message.includes('error') ? 'rgba(16, 185, 129, 0.20)' : 'rgba(244, 63, 94, 0.20)'}`
                }}>
                  {message}
                </Box>
              )}

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@organization.com"
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  sx={{
                    mt: 1,
                    py: 1.2,
                    fontSize: '0.875rem',
                    bgcolor: '#f4f4f5',
                    color: '#09090b',
                    '&:hover': {
                      bgcolor: '#ffffff',
                      boxShadow: '0 0 20px -2px rgba(255, 255, 255, 0.3)'
                    }
                  }}
                  disabled={authLoading}
                >
                  {authLoading ? <CircularProgress size={22} color="inherit" /> : (isSignUp ? 'Create Account' : 'Sign In')}
                </Button>

                <Button
                  variant="text"
                  onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    color: '#a1a1aa',
                    '&:hover': { color: '#f4f4f5', bgcolor: 'transparent' }
                  }}
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </Button>
              </form>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
        <Router>
          <Layout>
            <Routes>
              <Route 
                path="/" 
                element={
                  <React.Suspense fallback={<AppShellSkeleton />}>
                    <LandingPage />
                  </React.Suspense>
                } 
              />
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/work-orders" element={<WorkOrder />} />
              <Route path="/work-order" element={<WorkOrder />} />
              <Route path="/invoices" element={<InvoiceGenerator />} />
              <Route path="/vendor-invoice" element={<VendorInvoice />} />
              <Route path="/workorder-invoice" element={<WorkOrderInvoice />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/amount-paid" element={<AmountPaid />} />
            </Routes>
          </Layout>
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
