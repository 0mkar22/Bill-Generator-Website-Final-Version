import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase } from './supabase';

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
  
  // New state variables for Sign Up flow
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
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10vh' }}>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '320px' }}>
          <h2 style={{ textAlign: 'center' }}>{isSignUp ? 'Create Account' : 'Login'}</h2>
          
          {message && <p style={{ color: 'green', fontSize: '0.9rem', textAlign: 'center' }}>{message}</p>}
          
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" style={{ padding: '10px', marginTop: '5px' }}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
          
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
            style={{ 
              background: 'none', 
              color: '#396cd8', 
              border: 'none', 
              cursor: 'pointer', 
              marginTop: '10px',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </form>
      </div>
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