import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';

import { Container, Paper, Typography, TextField, Button, Box, CircularProgress, ThemeProvider, createTheme } from '@mui/material';

import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import WorkOrder from './pages/WorkOrder';
import Reports from './pages/Reports';
import WorkOrderInvoice from './pages/WorkOrderInvoice';
import VendorInvoice from './pages/VendorInvoice';
import InvoiceGenerator from './pages/InvoiceGenerator';


const theme = createTheme({
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
});

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
    return (
      <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
      </ThemeProvider>
    );
  }

  if (!session) {
    return (
      <ThemeProvider theme={theme}>
      <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
        <Paper elevation={4} sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.3)', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)' }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <img src="/logo.png" alt="Company Logo" style={{ height: '80px', marginBottom: '16px' }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              {isSignUp ? 'Create Account' : 'Login'}
            </Typography>
          </Box>

          {message && (
            <Typography variant="body2" color={isSignUp && !message.includes('error') ? 'success.main' : 'error.main'} align="center" sx={{ bgcolor: isSignUp && !message.includes('error') ? '#e8f5e9' : '#ffebee', p: 1, borderRadius: 1 }}>
              {message}
            </Typography>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TextField
              label="Email Address"
              type="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
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
              sx={{ mt: 1, py: 1.5, fontWeight: 'bold' }}
              disabled={authLoading}
            >
              {authLoading ? <CircularProgress size={24} color="inherit" /> : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>

            <Button
              variant="text"
              onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
              fullWidth
              sx={{ textTransform: 'none', mt: 1 }}
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Button>
          </form>
        </Paper>
      </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<WorkOrder />} />
            <Route path="/invoices" element={<InvoiceGenerator />} />
            <Route path="/vendor-invoice" element={<VendorInvoice />} />
            <Route path="/workorder-invoice" element={<WorkOrderInvoice />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
