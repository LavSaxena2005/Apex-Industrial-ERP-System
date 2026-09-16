import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory2';
import LogoutIcon from '@mui/icons-material/Logout';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FactoryIcon from '@mui/icons-material/Factory';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Enquiries',        value: 'enquiries',  icon: <AssignmentIcon fontSize="small" />,   desc: 'Manage customer enquiries' },
  { label: 'Quotations',       value: 'quotations', icon: <RequestQuoteIcon fontSize="small" />, desc: 'Create & send quotations' },
  { label: 'Sales Orders',     value: 'orders',     icon: <ShoppingCartIcon fontSize="small" />, desc: 'Confirm orders & dispatch' },
  { label: 'Inventory',        value: 'inventory',  icon: <InventoryIcon fontSize="small" />,    desc: 'Stock & reservations' },
];

const DrawerNavigation = ({ activeTab, setActiveTab, drawerWidth }) => {
  const { user, logout, quickLogin, isAdmin } = useAuth();

  const handleRoleToggle = async () => {
    if (isAdmin) await quickLogin('SALES_USER');
    else await quickLogin('ADMIN');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: '#ffffff',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          px: 2,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: '#dc2626', // Solid red brand box
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FactoryIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle2" noWrap fontWeight={700} lineHeight={1.2}>
            Apex Industrial
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            ERP System
          </Typography>
        </Box>
      </Box>

      {/* Navigation Label */}
      <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            fontSize: '0.68rem',
          }}
        >
          Navigation
        </Typography>
      </Box>

      {/* Nav Items */}
      <List dense sx={{ px: 0, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => (
          <Tooltip key={item.value} title={item.desc} placement="right" arrow>
            <ListItemButton
              selected={activeTab === item.value}
              onClick={() => setActiveTab(item.value)}
              id={`nav-${item.value}`}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 1.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(220, 38, 38, 0.08)', // Red subtle background
                  color: '#dc2626', // Red text
                  '& .MuiListItemIcon-root': { color: '#dc2626' }, // Red icon
                  '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.12)' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: activeTab === item.value ? '#dc2626' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: activeTab === item.value ? 700 : 500 }}
              />
            </ListItemButton>
          </Tooltip>
        ))}
      </List>

      {/* Bottom — User Info */}
      <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1.5 }}>
        {/* Role switcher */}
        <ListItemButton
          id="btn-switch-role"
          onClick={handleRoleToggle}
          sx={{ borderRadius: 2, mb: 0.5, py: 1 }}
        >
          <ListItemIcon>
            <SwapHorizIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText
            primary={`Switch to ${isAdmin ? 'Sales' : 'Admin'}`}
            primaryTypographyProps={{ fontSize: '0.8rem', color: 'text.secondary' }}
          />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        {/* User card */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: isAdmin ? '#e8e3f7' : '#e0f2fe',
              color: isAdmin ? '#6d28d9' : '#0369a1',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {isAdmin ? <AdminPanelSettingsIcon fontSize="small" /> : <PersonIcon fontSize="small" />}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="caption" fontWeight={600} noWrap display="block">
              {user?.name || 'User'}
            </Typography>
            <Chip
              label={isAdmin ? 'Admin' : 'Sales'}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: isAdmin ? '#ede9fe' : '#e0f2fe',
                color: isAdmin ? '#6d28d9' : '#0369a1',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Box>
          <Tooltip title="Sign Out">
            <IconButton id="btn-logout" size="small" onClick={logout} sx={{ color: 'text.secondary' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Drawer>
  );
};

export default DrawerNavigation;
