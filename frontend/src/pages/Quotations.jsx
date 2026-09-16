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
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

export const Quotations = ({ initialEnquiry, onNavigateToSalesOrders }) => {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const [formEnquiryId, setFormEnquiryId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [quoRes, enqRes, prodRes] = await Promise.all([
        api.getQuotations(),
        api.getEnquiries(),
        api.getProducts(),
      ]);
      setQuotations(quoRes.data || []);
      setEnquiries(enqRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (initialEnquiry) handleOpenCreateFromEnquiry(initialEnquiry);
  }, [initialEnquiry]);

  const next15Days = () => new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const handleOpenCreateFromEnquiry = (enquiry) => {
    setFormEnquiryId(enquiry.id);
    setValidUntil(next15Days());
    const items = (enquiry.items || []).map((it) => ({
      product_id: it.product_id,
      product_name: it.product?.product_name || '',
      product_code: it.product?.product_code || '',
      quantity: it.quantity,
      unit_price: it.product?.base_price || 1000,
      discount_percent: 5,
      gst_percent: 18,
    }));
    setQuoteItems(items.length > 0 ? items : [{ product_id: '', quantity: 1, unit_price: 1000, discount_percent: 0, gst_percent: 18 }]);
    setErrorMessage('');
    setIsCreateOpen(true);
  };

  const handleEnquirySelectChange = (enquiryId) => {
    setFormEnquiryId(enquiryId);
    const enq = enquiries.find((e) => e.id === parseInt(enquiryId, 10));
    if (enq?.items) {
      setQuoteItems(enq.items.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.product?.base_price || 1000,
        discount_percent: 5,
        gst_percent: 18,
      })));
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    setQuoteItems((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const computeClientTotals = () => {
    let subtotal = 0, discountTotal = 0, taxableTotal = 0, gstTotal = 0;
    quoteItems.forEach((it) => {
      const base = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
      const dAmt = base * ((parseFloat(it.discount_percent) || 0) / 100);
      const tax = base - dAmt;
      const gAmt = tax * ((parseFloat(it.gst_percent) || 0) / 100);
      subtotal += base; discountTotal += dAmt; taxableTotal += tax; gstTotal += gAmt;
    });
    return {
      subtotal: subtotal.toFixed(2),
      discountTotal: discountTotal.toFixed(2),
      taxableTotal: taxableTotal.toFixed(2),
      gstTotal: gstTotal.toFixed(2),
      grandTotal: (taxableTotal + gstTotal).toFixed(2),
    };
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    try {
      await api.createQuotation({
        enquiry_id: parseInt(formEnquiryId, 10),
        valid_until: validUntil,
        items: quoteItems.map((it) => ({
          product_id: parseInt(it.product_id, 10),
          quantity: parseInt(it.quantity, 10),
          unit_price: parseFloat(it.unit_price),
          discount_percent: parseFloat(it.discount_percent || 0),
          gst_percent: parseFloat(it.gst_percent || 18),
        })),
      });
      setIsCreateOpen(false);
      fetchData();
      setSuccessMessage('Quotation created with server-computed taxes!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create quotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.updateQuotationStatus(id, status);
      fetchData();
      if (selectedQuote?.id === id) setSelectedQuote((p) => ({ ...p, status }));
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConvertToOrder = async (quote) => {
    try {
      const res = await api.convertToSalesOrder(quote.id);
      fetchData();
      alert(`Quotation ${quote.quotation_number} converted to ${res.data.order_number}.`);
      if (onNavigateToSalesOrders) onNavigateToSalesOrders();
    } catch (err) {
      alert(err.message || 'Failed to convert to Sales Order.');
    }
  };

  const clientTotals = computeClientTotals();

  const filtered = quotations.filter((q) => {
    const matchSearch =
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.company_name.toLowerCase().includes(search.toLowerCase()) ||
      q.enquiry?.enquiry_number.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filterStatus === 'ALL' || q.status === filterStatus);
  });

  return (
    <Box>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#fff' }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Commercial Quotations</Typography>
            <Typography variant="caption" color="text.secondary">
              Itemized pricing, discount, GST calculation, and order conversion
            </Typography>
          </Box>
          <Button
            id="btn-new-quotation"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setValidUntil(next15Days());
              setFormEnquiryId('');
              setQuoteItems([{ product_id: '', quantity: 1, unit_price: 1000, discount_percent: 5, gst_percent: 18 }]);
              setErrorMessage('');
              setIsCreateOpen(true);
            }}
          >
            Create Quotation
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            size="small"
            placeholder="Search by quote #, enquiry #, or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="SENT">Sent</MenuItem>
              <MenuItem value="ACCEPTED">Accepted</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table */}
        {loading ? (
          <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={32} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <RequestQuoteIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No quotations found.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Quotation #</TableCell>
                  <TableCell>Enquiry Ref</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">GST</TableCell>
                  <TableCell align="right">Grand Total</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">{q.quotation_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">{q.enquiry?.enquiry_number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{q.customer?.company_name}</Typography>
                    </TableCell>
                    <TableCell><StatusBadge status={q.status} /></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace">₹{Number(q.subtotal).toLocaleString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace" color="error.main">-₹{Number(q.total_discount).toLocaleString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace">₹{Number(q.total_gst).toLocaleString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} fontFamily="monospace" color="primary.main">
                        ₹{Number(q.grand_total).toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button size="small" variant="outlined" onClick={() => setSelectedQuote(q)} sx={{ fontSize: '0.75rem' }}>
                          Details
                        </Button>
                        {q.status === 'DRAFT' && (
                          <Button size="small" variant="outlined" startIcon={<SendIcon fontSize="small" />} onClick={() => handleStatusUpdate(q.id, 'SENT')} sx={{ fontSize: '0.75rem' }}>
                            Send
                          </Button>
                        )}
                        {q.status === 'SENT' && (
                          <>
                            <Button size="small" variant="contained" color="success" startIcon={<CheckIcon fontSize="small" />} onClick={() => handleStatusUpdate(q.id, 'ACCEPTED')} sx={{ fontSize: '0.75rem' }}>
                              Accept
                            </Button>
                            <Button size="small" variant="outlined" color="error" startIcon={<CloseIcon fontSize="small" />} onClick={() => handleStatusUpdate(q.id, 'REJECTED')} sx={{ fontSize: '0.75rem' }}>
                              Reject
                            </Button>
                          </>
                        )}
                        {q.status === 'ACCEPTED' && !q.sales_order && (
                          <Button
                            id={`btn-convert-${q.id}`}
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<SwapHorizIcon fontSize="small" />}
                            onClick={() => handleConvertToOrder(q)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            Convert to SO
                          </Button>
                        )}
                        {q.sales_order && (
                          <Chip label={q.sales_order.order_number} size="small" color="primary" variant="outlined" sx={{ height: 24, fontFamily: 'monospace', fontWeight: 700, fontSize: '0.72rem' }} />
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

      {/* CREATE QUOTATION DIALOG */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Create Commercial Quotation</DialogTitle>
        <Divider />
        <form onSubmit={handleCreateQuotation}>
          <DialogContent>
            {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={8}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Select Enquiry *</InputLabel>
                  <Select label="Select Enquiry *" value={formEnquiryId} onChange={(e) => handleEnquirySelectChange(e.target.value)}>
                    <MenuItem value=""><em>Choose enquiry…</em></MenuItem>
                    {enquiries.map((enq) => (
                      <MenuItem key={enq.id} value={enq.id}>
                        {enq.enquiry_number} – {enq.customer?.company_name} ({enq.items?.length || 0} items)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField type="date" label="Valid Until *" required fullWidth size="small" InputLabelProps={{ shrink: true }} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </Grid>
            </Grid>

            {/* Pricing table */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Pricing &amp; Tax Rates</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 280, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Unit Price (₹)</TableCell>
                    <TableCell>Discount %</TableCell>
                    <TableCell>GST %</TableCell>
                    <TableCell align="right">Line Est.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quoteItems.map((it, idx) => {
                    const base = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
                    const d = base * ((parseFloat(it.discount_percent) || 0) / 100);
                    const tax = base - d;
                    const gst = tax * ((parseFloat(it.gst_percent) || 0) / 100);
                    const lineEst = tax + gst;
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select size="small" required value={it.product_id} onChange={(e) => handleItemFieldChange(idx, 'product_id', e.target.value)} sx={{ minWidth: 200, fontSize: '0.8rem' }}>
                            <MenuItem value=""><em>Choose product…</em></MenuItem>
                            {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.product_code} – {p.product_name}</MenuItem>)}
                          </Select>
                        </TableCell>
                        <TableCell><TextField size="small" type="number" inputProps={{ min: 1 }} value={it.quantity} onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)} sx={{ width: 72 }} /></TableCell>
                        <TableCell><TextField size="small" type="number" inputProps={{ min: 0, step: '0.01' }} value={it.unit_price} onChange={(e) => handleItemFieldChange(idx, 'unit_price', e.target.value)} sx={{ width: 110 }} /></TableCell>
                        <TableCell><TextField size="small" type="number" inputProps={{ min: 0, max: 100, step: '0.1' }} value={it.discount_percent} onChange={(e) => handleItemFieldChange(idx, 'discount_percent', e.target.value)} sx={{ width: 80 }} /></TableCell>
                        <TableCell><TextField size="small" type="number" inputProps={{ min: 0, step: '0.1' }} value={it.gst_percent} onChange={(e) => handleItemFieldChange(idx, 'gst_percent', e.target.value)} sx={{ width: 80 }} /></TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">₹{lineEst.toFixed(2)}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals summary */}
            <Paper variant="outlined" sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
              <Grid container spacing={1} justifyContent="center" textAlign="center">
                {[
                  { label: 'Subtotal', value: `₹${clientTotals.subtotal}`, color: 'text.primary' },
                  { label: 'Total Discount', value: `-₹${clientTotals.discountTotal}`, color: 'error.main' },
                  { label: 'Taxable Value', value: `₹${clientTotals.taxableTotal}`, color: 'text.primary' },
                  { label: 'Total GST', value: `₹${clientTotals.gstTotal}`, color: 'text.primary' },
                  { label: 'Grand Total', value: `₹${clientTotals.grandTotal}`, color: 'primary.main', bold: true },
                ].map((s) => (
                  <Grid item xs key={s.label}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" display="block">{s.label}</Typography>
                    <Typography variant={s.bold ? 'subtitle1' : 'body2'} fontWeight={s.bold ? 800 : 600} color={s.color} fontFamily="monospace">{s.value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </DialogContent>
          <Divider />
          <DialogActions>
            <Button variant="outlined" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button id="btn-submit-quotation" type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Generate Quotation'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* QUOTATION BREAKDOWN DIALOG */}
      <Dialog open={!!selectedQuote} onClose={() => setSelectedQuote(null)} maxWidth="md" fullWidth>
        <DialogTitle>Pricing Breakdown — {selectedQuote?.quotation_number}</DialogTitle>
        <Divider />
        <DialogContent>
          {selectedQuote && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" fontWeight={700}>Client</Typography>
                    <Typography variant="subtitle1" fontWeight={700} mt={0.5}>{selectedQuote.customer?.company_name}</Typography>
                    <Typography variant="caption" color="text.secondary">Ref Enquiry: {selectedQuote.enquiry?.enquiry_number}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing="0.06em" fontWeight={700}>Status</Typography>
                    <Box mt={0.5} mb={0.5}><StatusBadge status={selectedQuote.status} /></Box>
                    <Typography variant="caption" color="text.secondary">Valid Until: {new Date(selectedQuote.valid_until).toLocaleDateString()}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700} mb={1}>Itemized Tax &amp; Discount Calculation</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Base Amount</TableCell>
                      <TableCell align="right">Disc %</TableCell>
                      <TableCell align="right">Taxable</TableCell>
                      <TableCell align="right">GST</TableCell>
                      <TableCell align="right">Line Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedQuote.items?.map((it) => {
                      const baseAmt = Number(it.quantity) * Number(it.unit_price);
                      const discAmt = baseAmt * (Number(it.discount_percent) / 100);
                      const taxable = baseAmt - discAmt;
                      const gstAmt = taxable * (Number(it.gst_percent) / 100);
                      return (
                        <TableRow key={it.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">{it.product?.product_code}</Typography>
                            <Typography variant="caption" color="text.secondary">{it.product?.product_name}</Typography>
                          </TableCell>
                          <TableCell align="right"><Typography variant="body2" fontFamily="monospace">{it.quantity}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontFamily="monospace">₹{Number(it.unit_price).toLocaleString('en-IN')}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontFamily="monospace">₹{baseAmt.toLocaleString('en-IN')}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" color="error.main" fontFamily="monospace">{Number(it.discount_percent)}%</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontFamily="monospace">₹{taxable.toLocaleString('en-IN')}</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontFamily="monospace">{Number(it.gst_percent)}%</Typography></TableCell>
                          <TableCell align="right"><Typography variant="body2" fontWeight={700} color="primary.main" fontFamily="monospace">₹{Number(it.line_amount).toLocaleString('en-IN')}</Typography></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: 280 }}>
                  {[
                    { label: 'Subtotal', value: `₹${Number(selectedQuote.subtotal).toLocaleString('en-IN')}` },
                    { label: 'Total Discount', value: `-₹${Number(selectedQuote.total_discount).toLocaleString('en-IN')}`, color: 'error.main' },
                    { label: 'Taxable Amount', value: `₹${Number(selectedQuote.taxable_amount).toLocaleString('en-IN')}` },
                    { label: 'GST', value: `₹${Number(selectedQuote.total_gst).toLocaleString('en-IN')}` },
                  ].map((row) => (
                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                      <Typography variant="body2" fontFamily="monospace" color={row.color || 'text.primary'}>{row.value}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" fontWeight={700}>Grand Total</Typography>
                    <Typography variant="subtitle1" fontWeight={800} color="primary.main" fontFamily="monospace">₹{Number(selectedQuote.grand_total).toLocaleString('en-IN')}</Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button variant="outlined" onClick={() => setSelectedQuote(null)}>Close</Button>
          {selectedQuote?.status === 'ACCEPTED' && !selectedQuote?.sales_order && (
            <Button
              variant="contained"
              color="success"
              startIcon={<SwapHorizIcon />}
              onClick={() => { const q = selectedQuote; setSelectedQuote(null); handleConvertToOrder(q); }}
            >
              Convert to Sales Order
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
