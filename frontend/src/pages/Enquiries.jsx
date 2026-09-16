import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export const Enquiries = ({ onNavigateToQuotation }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const [formData, setFormData] = useState({
    customer_id: '',
    required_date: '',
    notes: '',
    items: [{ product_id: '', quantity: 1 }],
  });

  const [newCustomer, setNewCustomer] = useState({
    company_name: '',
    contact_person: '',
    mobile: '',
    email: '',
    city: '',
  });

  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enqRes, custRes, prodRes] = await Promise.all([
        api.getEnquiries(),
        api.getCustomers(),
        api.getProducts(),
      ]);
      setEnquiries(enqRes.data || []);
      setCustomers(custRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Error fetching enquiries data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, { product_id: '', quantity: 1 }] }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      items[index][field] = value;
      return { ...prev, items };
    });
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      await api.createEnquiry({
        customer_id: formData.customer_id,
        required_date: formData.required_date,
        notes: formData.notes,
        items: formData.items.map((it) => ({
          product_id: parseInt(it.product_id, 10),
          quantity: parseInt(it.quantity, 10),
        })),
      });
      setIsCreateOpen(false);
      setFormData({ customer_id: '', required_date: '', notes: '', items: [{ product_id: '', quantity: 1 }] });
      fetchData();
    } catch (err) {
      setSubmitError(err.message || 'Failed to create enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createCustomer(newCustomer);
      setCustomers((prev) => [...prev, res.data]);
      setFormData((prev) => ({ ...prev, customer_id: res.data.id }));
      setIsCustomerModalOpen(false);
      setNewCustomer({ company_name: '', contact_person: '', mobile: '', email: '', city: '' });
    } catch (err) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const filtered = enquiries.filter((enq) => {
    const matchSearch =
      enq.enquiry_number.toLowerCase().includes(search.toLowerCase()) ||
      enq.customer?.company_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || enq.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <Box>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#fff' }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Customer Enquiries</Typography>
            <Typography variant="caption" color="text.secondary">
              Manage incoming customer demand and specifications
            </Typography>
          </Box>
          <Button
            id="btn-create-enquiry"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setSubmitError(''); setIsCreateOpen(true); }}
          >
            Create Enquiry
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            size="small"
            placeholder="Search by enquiry number or company name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="NEW">New</MenuItem>
              <MenuItem value="QUOTED">Quoted</MenuItem>
              <MenuItem value="WON">Won</MenuItem>
              <MenuItem value="LOST">Lost</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No enquiries found matching your criteria.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Enquiry #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Enquiry Date</TableCell>
                  <TableCell>Required Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((enq) => (
                  <TableRow key={enq.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">
                        {enq.enquiry_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{enq.customer?.company_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {enq.customer?.contact_person} · {enq.customer?.city}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {new Date(enq.enquiry_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {new Date(enq.required_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${enq.items?.length || 0} products`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell><StatusBadge status={enq.status} /></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{enq.creator?.name}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="outlined" onClick={() => setSelectedEnquiry(enq)} sx={{ fontSize: '0.78rem' }}>
                          View
                        </Button>
                        {onNavigateToQuotation && (
                          <Button
                            size="small"
                            variant="contained"
                            endIcon={<OpenInNewIcon fontSize="small" />}
                            onClick={() => onNavigateToQuotation(enq)}
                            sx={{ fontSize: '0.78rem' }}
                          >
                            Quote
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* CREATE ENQUIRY DIALOG */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Customer Enquiry</DialogTitle>
        <Divider />
        <form onSubmit={handleCreateEnquiry}>
          <DialogContent>
            {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Customer *</InputLabel>
                  <Select
                    label="Customer *"
                    value={formData.customer_id}
                    onChange={(e) => setFormData((p) => ({ ...p, customer_id: e.target.value }))}
                  >
                    <MenuItem value=""><em>Select Customer…</em></MenuItem>
                    {customers.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.company_name} ({c.city})</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setIsCustomerModalOpen(true)}
                  sx={{ height: 40 }}
                >
                  + New Customer
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="date"
                  label="Required By Date *"
                  required
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={formData.required_date}
                  onChange={(e) => setFormData((p) => ({ ...p, required_date: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Project / Requirement Notes"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  placeholder="E.g. Requirement for turbine overhaul; test certificates required."
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                />
              </Grid>
            </Grid>

            {/* Product Line Items */}
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>Products Required *</Typography>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem}>
                  Add Product
                </Button>
              </Box>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {formData.items.map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 120px 40px',
                      gap: 1.5,
                      p: 1.5,
                      alignItems: 'center',
                      bgcolor: idx % 2 === 0 ? '#fafafa' : '#fff',
                      borderBottom: idx < formData.items.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <FormControl size="small" required>
                      <InputLabel>Product *</InputLabel>
                      <Select
                        label="Product *"
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                      >
                        <MenuItem value=""><em>Select product…</em></MenuItem>
                        {products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.product_code} – {p.product_name} ({p.unit})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      type="number"
                      label="Qty *"
                      required
                      inputProps={{ min: 1 }}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      disabled={formData.items.length === 1}
                      onClick={() => handleRemoveItem(idx)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Paper>
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button variant="outlined" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button id="submit-enquiry-btn" type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Create Enquiry'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ADD CUSTOMER DIALOG */}
      <Dialog open={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Business Customer</DialogTitle>
        <Divider />
        <form onSubmit={handleCreateCustomer}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Company Name *" required fullWidth size="small" value={newCustomer.company_name} onChange={(e) => setNewCustomer((p) => ({ ...p, company_name: e.target.value }))} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Contact Person *" required fullWidth size="small" value={newCustomer.contact_person} onChange={(e) => setNewCustomer((p) => ({ ...p, contact_person: e.target.value }))} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Mobile *" required fullWidth size="small" value={newCustomer.mobile} onChange={(e) => setNewCustomer((p) => ({ ...p, mobile: e.target.value }))} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="City *" required fullWidth size="small" value={newCustomer.city} onChange={(e) => setNewCustomer((p) => ({ ...p, city: e.target.value }))} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email *" type="email" required fullWidth size="small" value={newCustomer.email} onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))} />
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button variant="outlined" onClick={() => setIsCustomerModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Customer</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ENQUIRY DETAILS DIALOG */}
      <Dialog open={!!selectedEnquiry} onClose={() => setSelectedEnquiry(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Enquiry Details — {selectedEnquiry?.enquiry_number}
        </DialogTitle>
        <Divider />
        <DialogContent>
          {selectedEnquiry && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" fontWeight={700}>Customer</Typography>
                    <Typography variant="subtitle1" fontWeight={700} mt={0.5}>{selectedEnquiry.customer?.company_name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{selectedEnquiry.customer?.contact_person} · {selectedEnquiry.customer?.mobile}</Typography>
                    <Typography variant="caption" color="text.secondary">{selectedEnquiry.customer?.city}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" fontWeight={700}>Status &amp; Dates</Typography>
                    <Box mt={0.5} mb={1}><StatusBadge status={selectedEnquiry.status} /></Box>
                    <Typography variant="caption" color="text.secondary" display="block">Enquiry: {new Date(selectedEnquiry.enquiry_date).toLocaleDateString()}</Typography>
                    <Typography variant="caption" color="text.secondary">Required: {new Date(selectedEnquiry.required_date).toLocaleDateString()}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {selectedEnquiry.notes && (
                <Alert severity="info" icon={false} sx={{ mb: 2, borderRadius: 2 }}>
                  <Typography variant="caption" fontWeight={700}>Notes: </Typography>
                  <Typography variant="caption">{selectedEnquiry.notes}</Typography>
                </Alert>
              )}

              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Product Line Items ({selectedEnquiry.items?.length || 0})
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Code</TableCell>
                      <TableCell>Product Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Required Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedEnquiry.items?.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">{it.product?.product_code}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2">{it.product?.product_name}</Typography></TableCell>
                        <TableCell><Chip label={it.product?.category} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} /></TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} fontFamily="monospace">{it.quantity} {it.product?.unit}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button variant="outlined" onClick={() => setSelectedEnquiry(null)}>Close</Button>
          {onNavigateToQuotation && (
            <Button
              variant="contained"
              endIcon={<OpenInNewIcon />}
              onClick={() => {
                const enq = selectedEnquiry;
                setSelectedEnquiry(null);
                onNavigateToQuotation(enq);
              }}
            >
              Create Quotation
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
