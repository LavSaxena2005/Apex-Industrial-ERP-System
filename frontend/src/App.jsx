import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Enquiries } from './pages/Enquiries';
import { Quotations } from './pages/Quotations';
import { SalesOrders } from './pages/SalesOrders';
import { Inventory } from './pages/Inventory';

export const App = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // default to orders screen
  const [activeEnquiryForQuote, setActiveEnquiryForQuote] = useState(null);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-app)',
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
        }}
      >
        Initializing Apex ERP Workspace...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'enquiries' && (
          <Enquiries
            onNavigateToQuotation={(enquiry) => {
              setActiveEnquiryForQuote(enquiry);
              setActiveTab('quotations');
            }}
          />
        )}

        {activeTab === 'quotations' && (
          <Quotations
            initialEnquiry={activeEnquiryForQuote}
            onNavigateToSalesOrders={() => {
              setActiveEnquiryForQuote(null);
              setActiveTab('orders');
            }}
          />
        )}

        {activeTab === 'orders' && <SalesOrders />}

        {activeTab === 'inventory' && <Inventory />}
      </main>
    </div>
  );
};

export default App;
