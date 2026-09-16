import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stack,
} from '@mui/material';
import FactoryIcon from '@mui/icons-material/Factory';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Login = () => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(role);
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#f3f4f6',
      }}
    >
      {/* Left panel — branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 420px',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 6,
          bgcolor: '#ffffff',
          borderRight: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%),' +
              'radial-gradient(circle at 20% 80%, rgba(0,0,0,0.15) 0%, transparent 60%)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              bgcolor: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <FactoryIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          </Box>
          <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
            Apex Industrial ERP
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Enterprise Sales Lifecycle &amp; Real-Time Inventory Control
          </Typography>

          <Box sx={{ mt: 5 }}>
            {[
              'Customer → Enquiry',
              'Enquiry → Quotation',
              'Quotation → Sales Order',
              'Sales Order → Dispatch',
            ].map((step) => (
              <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right panel — login form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile brand */}
          <Box sx={{ display: { md: 'none' }, textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'primary.main',
                borderRadius: 2,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <FactoryIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Apex Industrial ERP
            </Typography>
          </Box>

          <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>
              Sign in to your account
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Enter your credentials below to continue
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  id="email-input"
                  label="Email address"
                  type="email"
                  required
                  fullWidth
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  id="password-input"
                  label="Password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  fullWidth
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPwd((s) => !s)}
                          edge="end"
                        >
                          {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  id="btn-submit-login"
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ mt: 1, py: 1.25 }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Quick Demo Access
              </Typography>
            </Divider>

            <Stack direction="row" spacing={1.5}>
              <Button
                id="demo-admin-login"
                variant="outlined"
                fullWidth
                disabled={loading}
                onClick={() => handleQuickDemo('ADMIN')}
                startIcon={<AdminPanelSettingsIcon />}
              >
                <Box textAlign="left">
                  <Typography variant="caption" display="block" fontWeight={700} lineHeight={1.2}>
                    Admin
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" fontSize="0.65rem">
                    Confirm &amp; Dispatch
                  </Typography>
                </Box>
              </Button>

              <Button
                id="demo-sales-login"
                variant="outlined"
                fullWidth
                disabled={loading}
                onClick={() => handleQuickDemo('SALES_USER')}
                startIcon={<PersonIcon />}
              >
                <Box textAlign="left">
                  <Typography variant="caption" display="block" fontWeight={700} lineHeight={1.2}>
                    Sales Exec
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" fontSize="0.65rem">
                    Enquiries &amp; Quotes
                  </Typography>
                </Box>
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
