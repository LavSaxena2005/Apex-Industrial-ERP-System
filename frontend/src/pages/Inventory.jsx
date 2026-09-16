import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import LockIcon from '@mui/icons-material/Lock';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';

const StatCard = ({ icon, label, value, color }) => (
  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#fff' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">
        {label}
      </Typography>
      <Box sx={{ color }}>{icon}</Box>
    </Box>
    <Typography variant="h5" fontWeight={700} color={color || 'text.primary'}>
      {value}
    </Typography>
  </Paper>
);

const StockHealth = ({ avail }) => {
  if (avail > 20) return <Chip label="Optimal" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, height: 22, fontSize: '0.72rem' }} />;
  if (avail > 0)  return <Chip label="Low Stock" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 700, height: 22, fontSize: '0.72rem' }} />;
  return             <Chip label="Out of Stock" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, height: 22, fontSize: '0.72rem' }} />;
};

export const Inventory = () => {
  const { isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [editingItem, setEditingItem] = useState(null);
  const [physicalQty, setPhysicalQty] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory();
      setInventory(res.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setPhysicalQty(item.physical_quantity);
    setEditError('');
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    setEditError('');
    setSaving(true);
    try {
      await api.updatePhysicalStock(editingItem.product_id, parseInt(physicalQty, 10));
      setEditingItem(null);
      fetchInventory();
    } catch (err) {
      setEditError(err.message || 'Failed to update physical stock');
    } finally {
      setSaving(false);
    }
  };

  const totalPhysical = inventory.reduce((a, i) => a + (i.physical_quantity || 0), 0);
  const totalReserved = inventory.reduce((a, i) => a + (i.reserved_quantity || 0), 0);
  const totalAvailable = totalPhysical - totalReserved;
  const categories = ['ALL', ...new Set(inventory.map((i) => i.category))];

  const filtered = inventory.filter((item) => {
    const matchSearch =
      item.product_code.toLowerCase().includes(search.toLowerCase()) ||
      item.product_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'ALL' || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <Box>
      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Inventory2Icon />} label="Total Products" value={inventory.length} color="primary.main" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<WarehouseIcon />} label="Physical Stock" value={`${totalPhysical} units`} color="#0369a1" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<LockIcon />} label="Reserved for Orders" value={`${totalReserved} units`} color="#92400e" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<TrendingUpIcon />} label="Available to Sell" value={`${totalAvailable} units`} color="#15803d" />
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#fff' }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Inventory &amp; Availability</Typography>
            <Typography variant="caption" color="text.secondary">
              Available = Physical − Reserved (real-time)
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchInventory}
          >
            Refresh
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            size="small"
            placeholder="Search product code or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CategoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No inventory records found.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product Code</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell align="right">Physical</TableCell>
                  <TableCell align="right">Reserved</TableCell>
                  <TableCell align="right">Available</TableCell>
                  <TableCell>Health</TableCell>
                  {isAdmin && <TableCell align="right">Action</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((item) => {
                  const avail = item.available_quantity;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">
                          {item.product_code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.product_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.category} size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 22 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{item.unit}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          ₹{Number(item.base_price).toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} fontFamily="monospace">{item.physical_quantity}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontFamily="monospace" color="warning.main" fontWeight={600}>{item.reserved_quantity}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          fontFamily="monospace"
                          color={avail > 20 ? 'success.main' : avail > 0 ? 'warning.main' : 'error.main'}
                        >
                          {avail}
                        </Typography>
                      </TableCell>
                      <TableCell><StockHealth avail={avail} /></TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon fontSize="small" />}
                            onClick={() => handleOpenEdit(item)}
                            sx={{ fontSize: '0.78rem' }}
                          >
                            Adjust
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Adjust Stock Dialog */}
      <Dialog open={!!editingItem} onClose={() => setEditingItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Physical Stock</DialogTitle>
        <Divider />
        <form onSubmit={handleSaveStock}>
          <DialogContent>
            {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>{editingItem?.product_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Code: {editingItem?.product_code} · Reserved: <strong>{editingItem?.reserved_quantity}</strong> units
              </Typography>
            </Paper>
            <TextField
              label="New Physical Quantity"
              type="number"
              required
              fullWidth
              inputProps={{ min: editingItem?.reserved_quantity || 0 }}
              value={physicalQty}
              onChange={(e) => setPhysicalQty(e.target.value)}
              helperText={`Cannot be below reserved units (${editingItem?.reserved_quantity})`}
            />
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button variant="outlined" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
