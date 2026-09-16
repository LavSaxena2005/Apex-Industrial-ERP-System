import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import DrawerNavigation from './components/DrawerNavigation';
import Login from './pages/Login';
import { Enquiries } from './pages/Enquiries';
import { Quotations } from './pages/Quotations';
import { SalesOrders } from './pages/SalesOrders';
import { Inventory } from './pages/Inventory';

const DRAWER_WIDTH = 248;

export const App = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');
  const [activeEnquiryForQuote, setActiveEnquiryForQuote] = useState(null);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={36} />
        <Typography variant="body2" color="text.secondary">
          Loading Apex ERP…
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DrawerNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        drawerWidth={DRAWER_WIDTH}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${DRAWER_WIDTH}px`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
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
        </Box>
      </Box>
    </Box>
  );
};
