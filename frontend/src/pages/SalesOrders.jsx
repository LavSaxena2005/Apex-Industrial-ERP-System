import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { TraceabilityBanner } from '../components/TraceabilityBanner';
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
  Tooltip,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const StockReadiness = ({ status, isSufficient }) => {
  if (status === 'PENDING') {
    return isSufficient
      ? <Chip label="Stock Available" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, height: 22, fontSize: '0.72rem' }} />
      : <Chip label="Stock Shortage" size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, height: 22, fontSize: '0.72rem' }} />;
  }
  if (status === 'CONFIRMED') return <Chip label="✓ Reserved" size="small" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700, height: 22, fontSize: '0.72rem' }} />;
  if (status === 'DISPATCHED') return <Chip label="✓ Dispatched" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, height: 22, fontSize: '0.72rem' }} />;
  return <Typography variant="caption" color="text.disabled">—</Typography>;
};

export const SalesOrders = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [traceModalOrder, setTraceModalOrder] = useState(null);
  const [traceData, setTraceData] = useState(null);

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchError, setDispatchError] = useState('');
  const [dispatching, setDispatching] = useState(false);

  const [alertInfo, setAlertInfo] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordRes, invRes] = await Promise.all([api.getSalesOrders(), api.getInventory()]);
      setOrders(ordRes.data || []);
      setInventory(invRes.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleConfirmReservation = async (orderId) => {
    try {
      setAlertInfo(null);
      await api.confirmSalesOrder(orderId);
      setAlertInfo({ type: 'success', message: 'Sales Order confirmed! Inventory reserved via PostgreSQL row locks.' });
      fetchData();
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to reserve inventory.' });
    }
  };

  const handleOpenDispatch = (order) => {
    setDispatchModalOrder(order);
    setVehicleNumber('MH-12-AB-4321');
    setDriverName('Rajesh Patil');
    setDispatchError('');
  };

  const handleProcessDispatch = async (e) => {
    e.preventDefault();
    setDispatchError('');
    setDispatching(true);
    try {
      const res = await api.dispatchSalesOrder(dispatchModalOrder.id, { vehicle_number: vehicleNumber, driver_name: driverName });
      setDispatchModalOrder(null);
      setAlertInfo({ type: 'success', message: `Dispatched under ${res.data.dispatch?.dispatch_number}! Stock decremented atomically.` });
      fetchData();
    } catch (err) {
      setDispatchError(err.message || 'Dispatch failed.');
    } finally {
      setDispatching(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this Sales Order? Any reserved stock will be released.')) return;
    try {
      await api.cancelSalesOrder(orderId);
      setAlertInfo({ type: 'info', message: 'Order cancelled and reserved stock released.' });
      fetchData();
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message || 'Failed to cancel order.' });
    }
  };

  const handleOpenTraceability = async (order) => {
    setTraceModalOrder(order);
    setTraceData(null);
    try {
      const res = await api.getTraceability('sales_order', order.id);
      setTraceData(res.data);
    } catch (err) {
      console.error('Traceability error:', err);
    }
  };

  const checkStockSufficiency = (order) => {
    if (order.status !== 'PENDING') return null;
    for (const it of order.items || []) {
      const inv = inventory.find((i) => i.product_id === it.product_id);
      if (!inv || inv.available_quantity < it.quantity) return false;
    }
    return true;
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.company_name.toLowerCase().includes(search.toLowerCase()) ||
      o.quotation?.quotation_number.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filterStatus === 'ALL' || o.status === filterStatus);
  });

  return (
    <Box>
      {/* Traceability Banner */}
      <TraceabilityBanner activeStage={4} metadata={{ orderNumber: 'SO-xxxx' }} />

      {/* Alert */}
      {alertInfo && (
        <Alert
          severity={alertInfo.type}
          onClose={() => setAlertInfo(null)}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {alertInfo.message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#fff' }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Sales Orders &amp; Dispatch</Typography>
            <Typography variant="caption" color="text.secondary">
              Confirm orders, reserve stock, and process dispatches
            </Typography>
          </Box>
          <Chip
            label={`Role: ${isAdmin ? 'Admin — Full Access' : 'Sales — Read Only'}`}
            size="small"
            sx={{
              bgcolor: isAdmin ? '#ede9fe' : '#e0f2fe',
              color: isAdmin ? '#6d28d9' : '#0369a1',
              fontWeight: 700,
              fontSize: '0.78rem',
            }}
          />
        </Box>

        {/* Filters */}
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            size="small"
            placeholder="Search by order #, customer, or quotation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="CONFIRMED">Confirmed (Reserved)</MenuItem>
              <MenuItem value="DISPATCHED">Dispatched</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <ShoppingCartIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No sales orders found.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Quotation Ref</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((ord) => {
                  const isSufficient = checkStockSufficiency(ord);
                  return (
                    <TableRow key={ord.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">{ord.order_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{ord.customer?.company_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">{ord.quotation?.quotation_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">{new Date(ord.order_date).toLocaleDateString()}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} fontFamily="monospace">₹{Number(ord.total_amount).toLocaleString('en-IN')}</Typography>
                      </TableCell>
                      <TableCell><StatusBadge status={ord.status} /></TableCell>
                      <TableCell><StockReadiness status={ord.status} isSufficient={isSufficient} /></TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="View Items">
                            <IconButton size="small" onClick={() => setSelectedOrder(ord)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Audit Trail">
                            <IconButton size="small" onClick={() => handleOpenTraceability(ord)}>
                              <TimelineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {ord.status === 'PENDING' && (
                            <Tooltip title={isAdmin ? 'Confirm & Reserve Stock' : 'Requires Admin role'}>
                              <span>
                                <Button
                                  id={`btn-confirm-${ord.id}`}
                                  size="small"
                                  variant="contained"
                                  startIcon={<LockIcon fontSize="small" />}
                                  disabled={!isAdmin}
                                  onClick={() => handleConfirmReservation(ord.id)}
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  Confirm
                                </Button>
                              </span>
                            </Tooltip>
                          )}
                          {ord.status === 'CONFIRMED' && (
                            <Tooltip title={isAdmin ? 'Process Dispatch' : 'Requires Admin role'}>
                              <span>
                                <Button
                                  id={`btn-dispatch-${ord.id}`}
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<LocalShippingIcon fontSize="small" />}
                                  disabled={!isAdmin}
                                  onClick={() => handleOpenDispatch(ord)}
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  Dispatch
                                </Button>
                              </span>
                            </Tooltip>
                          )}
                          {(ord.status === 'PENDING' || ord.status === 'CONFIRMED') && (
                            <Tooltip title={isAdmin ? 'Cancel Order' : 'Requires Admin role'}>
                              <span>
                                <IconButton size="small" color="error" disabled={!isAdmin} onClick={() => handleCancelOrder(ord.id)}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ORDER ITEMS DIALOG */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth>
        <DialogTitle>Order Items — {selectedOrder?.order_number}</DialogTitle>
        <Divider />
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" fontWeight={700}>Customer</Typography>
                    <Typography variant="subtitle1" fontWeight={700} mt={0.5}>{selectedOrder.customer?.company_name}</Typography>
                    <Typography variant="caption" color="text.secondary">Quotation: {selectedOrder.quotation?.quotation_number}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" fontWeight={700}>Status &amp; Amount</Typography>
                    <Box mt={0.5} mb={0.5}><StatusBadge status={selectedOrder.status} /></Box>
                    <Typography variant="subtitle2" fontWeight={800} fontFamily="monospace">₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700} mb={1}>Products &amp; Stock Status</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Code</TableCell>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell>Live Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items?.map((it) => {
                      const inv = inventory.find((i) => i.product_id === it.product_id);
                      const avail = inv ? inv.available_quantity : 0;
                      const isEnough = avail >= it.quantity;
                      return (
                        <TableRow key={it.id}>
                          <TableCell><Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">{it.product?.product_code}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{it.product?.product_name}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={700} fontFamily="monospace">{it.quantity} {it.product?.unit}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontFamily="monospace">₹{Number(it.unit_price).toLocaleString('en-IN')}</Typography></TableCell>
                          <TableCell>
                            {selectedOrder.status === 'PENDING' ? (
                              <Chip
                                label={`${avail} units`}
                                size="small"
                                sx={{
                                  bgcolor: isEnough ? '#dcfce7' : '#fee2e2',
                                  color: isEnough ? '#15803d' : '#b91c1c',
                                  fontWeight: 700, height: 22, fontSize: '0.72rem',
                                }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">Reserved</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {selectedOrder.dispatches?.length > 0 && (
                <Alert severity="success" icon={<LocalShippingIcon />} sx={{ borderRadius: 2 }}>
                  {selectedOrder.dispatches.map((d) => (
                    <Typography key={d.id} variant="body2">
                      <strong>{d.dispatch_number}</strong> — {new Date(d.dispatch_date).toLocaleDateString()} | Vehicle: <strong>{d.vehicle_number}</strong> | Driver: <strong>{d.driver_name}</strong>
                    </Typography>
                  ))}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button variant="outlined" onClick={() => setSelectedOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* DISPATCH DIALOG */}
      <Dialog open={!!dispatchModalOrder} onClose={() => setDispatchModalOrder(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Dispatch — {dispatchModalOrder?.order_number}</DialogTitle>
        <Divider />
        <form onSubmit={handleProcessDispatch}>
          <DialogContent>
            {dispatchError && <Alert severity="error" sx={{ mb: 2 }}>{dispatchError}</Alert>}
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600}>{dispatchModalOrder?.customer?.company_name}</Typography>
              <Typography variant="caption">{dispatchModalOrder?.items?.length} products · Physical &amp; reserved stock will decrement atomically.</Typography>
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Vehicle Number *" required fullWidth size="small" placeholder="e.g. MH-12-AB-1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Driver Name *" required fullWidth size="small" placeholder="e.g. Rajesh Patil" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button variant="outlined" onClick={() => setDispatchModalOrder(null)}>Cancel</Button>
            <Button id="btn-confirm-dispatch" type="submit" variant="contained" color="primary" disabled={dispatching} startIcon={<LocalShippingIcon />}>
              {dispatching ? <CircularProgress size={18} color="inherit" /> : 'Confirm Dispatch'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* TRACEABILITY AUDIT DIALOG */}
      <Dialog open={!!traceModalOrder} onClose={() => setTraceModalOrder(null)} maxWidth="md" fullWidth>
        <DialogTitle>Audit Trail — {traceModalOrder?.order_number}</DialogTitle>
        <Divider />
        <DialogContent>
          {traceData ? (
            <Box>
              <Box sx={{ mb: 2 }}>
                <TraceabilityBanner
                  activeStage={
                    traceData.dispatches?.length > 0 ? 6
                      : traceData.salesOrder?.status === 'CONFIRMED' ? 5 : 4
                  }
                  metadata={{
                    customerName: traceData.customer?.company_name,
                    enquiryNumber: traceData.enquiry?.enquiry_number,
                    quotationNumber: traceData.quotation?.quotation_number,
                    orderNumber: traceData.salesOrder?.order_number,
                    reservedStatus: ['CONFIRMED', 'DISPATCHED'].includes(traceData.salesOrder?.status) ? 'Reserved' : 'Pending',
                    dispatchNumber: traceData.dispatches?.[0]?.dispatch_number,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {traceData.steps?.map((st) => (
                  <Paper
                    key={st.step}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em">Step {st.step}</Typography>
                      <Typography variant="subtitle2" fontWeight={700}>{st.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {st.data ? JSON.stringify(st.data) : 'Not initiated'}
                      </Typography>
                    </Box>
                    <StatusBadge status={st.completed ? 'CONFIRMED' : 'PENDING'} />
                  </Paper>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} /></Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button variant="outlined" onClick={() => setTraceModalOrder(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
