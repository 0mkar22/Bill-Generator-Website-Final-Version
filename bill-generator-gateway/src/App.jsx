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

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10vh' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
          <h2>Login</h2>
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
          <button type="submit">Sign In</button>
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