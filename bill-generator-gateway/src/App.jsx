import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';

// MUI Imports for styling
import { Container, Paper, Typography, TextField, Button, Box, CircularProgress } from '@mui/material';

import Layout from './components/Layout';
import WorkOrder from './pages/WorkOrder';
import Reports from './pages/Reports';
import WorkOrderInvoice from './pages/WorkOrderInvoice';
import VendorInvoice from './pages/VendorInvoice';
import InvoiceGenerator from './pages/InvoiceGenerator';

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false); // Added for button loading state
  
  // State variables for Sign Up flow
  const [isSignUp, setIsSignUp] = useState(false); 
  const [message, setMessage] = useState(''); 

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear any previous messages
    setAuthLoading(true);
    
    if (isSignUp) {
      // Handle Account Creation
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(error.message);
      } else {
        setMessage('Account created! Please check your email to verify.');
      }
    } else {
      // Handle Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setAuthLoading(false);
  };

  // Styled centered loading spinner for initial load
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // MUI Styled Login / Sign Up UI
  if (!session) {
    return (
      <Container maxWidth="xs" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80vh' }}>
        <Paper elevation={4} sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <img src="/ONGC logo.png" alt="Logo" style={{ height: '80px', marginBottom: '16px' }} />
            <Typography variant="h4" component="h1" fontWeight="bold">
              {isSignUp ? 'Create Account' : 'Login'}
            </Typography>
          </Box>
          
          {message && (
            <Typography variant="body2" color="success.main" align="center" sx={{ bgcolor: '#e8f5e9', p: 1, borderRadius: 1 }}>
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
    );
  }

  return (
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
  );
}

export default App;