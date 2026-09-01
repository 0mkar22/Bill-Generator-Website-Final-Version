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
import AmountPaid from './pages/AmountPaid';


const theme = createTheme({
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.6)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
          backgroundImage: 'none',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '16px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'none',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(255, 255, 255, 1)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
          },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        },
      },
    },
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
        <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <img src="/logo.PNG" alt="Company Logo" style={{ width: '100%', maxWidth: '250px', height: 'auto', margin: '0 auto', display: 'block',marginBottom: '20px' }} />
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
            <Route path="/amount-paid" element={<AmountPaid />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
