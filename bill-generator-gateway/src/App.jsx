import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import WorkOrder from './pages/WorkOrder';
import Reports from './pages/Reports';
import WorkOrderInvoice from './pages/WorkOrderInvoice';
import VendorInvoice from './pages/VendorInvoice';
import InvoiceGenerator from './pages/InvoiceGenerator'; // <-- Import the new page

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<WorkOrder />} />
          <Route path="/invoices" element={<InvoiceGenerator />} /> {/* <-- Main invoices route */}
          <Route path="/vendor-invoice" element={<VendorInvoice />} /> {/* Page to display the invoice */}
          <Route path="/workorder-invoice" element={<WorkOrderInvoice />} /> {/* Page to display the invoice */}
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}
export default App;