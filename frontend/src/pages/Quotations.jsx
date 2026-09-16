import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  Receipt,
  Plus,
  ArrowRight,
  Send,
  Check,
  X,
  FileCheck2,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';

export const Quotations = ({ initialEnquiry, onNavigateToSalesOrders }) => {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // Create Form State
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

  useEffect(() => {
    fetchData();
  }, []);

  // Handle incoming enquiry navigation from Enquiries screen
  useEffect(() => {
    if (initialEnquiry) {
      handleOpenCreateFromEnquiry(initialEnquiry);
    }
  }, [initialEnquiry]);

  const handleOpenCreateFromEnquiry = (enquiry) => {
    setFormEnquiryId(enquiry.id);
    // Set valid until to 15 days from now
    const next15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    setValidUntil(next15Days);

    const items = (enquiry.items || []).map((it) => ({
      product_id: it.product_id,
      product_name: it.product?.product_name || `Product #${it.product_id}`,
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
    if (enq && enq.items) {
      const items = enq.items.map((it) => ({
        product_id: it.product_id,
        product_name: it.product?.product_name || `Product #${it.product_id}`,
        product_code: it.product?.product_code || '',
        quantity: it.quantity,
        unit_price: it.product?.base_price || 1000,
        discount_percent: 5,
        gst_percent: 18,
      }));
      setQuoteItems(items);
    }
  };

  const handleItemFieldChange = (index, field, value) => {
    setQuoteItems((prev) => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  // Compute live preview on client (backend will still authoritative recompute!)
  const computeClientTotals = () => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxableTotal = 0;
    let gstTotal = 0;

    quoteItems.forEach((it) => {
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.unit_price) || 0;
      const disc = parseFloat(it.discount_percent) || 0;
      const gst = parseFloat(it.gst_percent) || 0;

      const base = qty * price;
      const dAmt = base * (disc / 100);
      const tax = base - dAmt;
      const gAmt = tax * (gst / 100);

      subtotal += base;
      discountTotal += dAmt;
      taxableTotal += tax;
      gstTotal += gAmt;
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
      const payload = {
        enquiry_id: parseInt(formEnquiryId, 10),
        valid_until: validUntil,
        items: quoteItems.map((it) => ({
          product_id: parseInt(it.product_id, 10),
          quantity: parseInt(it.quantity, 10),
          unit_price: parseFloat(it.unit_price),
          discount_percent: parseFloat(it.discount_percent || 0),
          gst_percent: parseFloat(it.gst_percent || 18),
        })),
      };

      await api.createQuotation(payload);
      setIsCreateOpen(false);
      fetchData();
      setSuccessMessage('Quotation created successfully with authoritative server-computed taxes!');
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
      if (selectedQuote && selectedQuote.id === id) {
        setSelectedQuote((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleConvertToOrder = async (quote) => {
    try {
      const res = await api.convertToSalesOrder(quote.id);
      fetchData();
      alert(`Success! Quotation ${quote.quotation_number} converted to Sales Order ${res.data.order_number}.`);
      if (onNavigateToSalesOrders) {
        onNavigateToSalesOrders();
      }
    } catch (err) {
      alert(err.message || 'Failed to convert quotation to Sales Order.');
    }
  };

  const clientTotals = computeClientTotals();

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.company_name.toLowerCase().includes(search.toLowerCase()) ||
      q.enquiry?.enquiry_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || q.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Receipt size={22} color="var(--primary)" />
            Commercial Quotations
          </h2>
          <p className="card-desc">
            Itemized pricing, discount structures, GST calculations, and order conversion.
          </p>
        </div>

        <button
          id="btn-new-quotation"
          className="btn btn-primary"
          onClick={() => {
            const next15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0];
            setValidUntil(next15Days);
            setFormEnquiryId('');
            setQuoteItems([
              { product_id: '', quantity: 1, unit_price: 1000, discount_percent: 5, gst_percent: 18 },
            ]);
            setErrorMessage('');
            setIsCreateOpen(true);
          }}
        >
          <Plus size={18} />
          Create Quotation
        </button>
      </div>

      {successMessage && (
        <div
          style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#34d399',
            fontSize: '0.85rem',
            marginBottom: '16px',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Filters Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search by quote #, enquiry #, or customer..."
            style={{ paddingLeft: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-dim)" />
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {/* Quotations Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading quotations...
        </div>
      ) : filteredQuotations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          No quotations found matching your criteria.
        </div>
      ) : (
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Enquiry Ref</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>GST (18%)</th>
                <th>Grand Total</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map((q) => (
                <tr key={q.id}>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {q.quotation_number}
                  </td>
                  <td className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                    {q.enquiry?.enquiry_number}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{q.customer?.company_name}</div>
                  </td>
                  <td>
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="font-mono">₹{Number(q.subtotal).toLocaleString('en-IN')}</td>
                  <td className="font-mono" style={{ color: '#f87171' }}>
                    -₹{Number(q.total_discount).toLocaleString('en-IN')}
                  </td>
                  <td className="font-mono">₹{Number(q.total_gst).toLocaleString('en-IN')}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: '#34d399' }}>
                    ₹{Number(q.grand_total).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedQuote(q)}
                      >
                        Breakdown
                      </button>

                      {q.status === 'DRAFT' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusUpdate(q.id, 'SENT')}
                          title="Send to Customer"
                        >
                          <Send size={13} />
                          Send
                        </button>
                      )}

                      {q.status === 'SENT' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleStatusUpdate(q.id, 'ACCEPTED')}
                            title="Accept Quotation"
                          >
                            <Check size={13} />
                            Accept
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleStatusUpdate(q.id, 'REJECTED')}
                            title="Reject Quotation"
                          >
                            <X size={13} />
                            Reject
                          </button>
                        </>
                      )}

                      {q.status === 'ACCEPTED' && !q.sales_order && (
                        <button
                          id={`btn-convert-${q.id}`}
                          className="btn btn-primary btn-sm"
                          onClick={() => handleConvertToOrder(q)}
                          title="Convert ACCEPTED Quotation to Sales Order"
                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                        >
                          <FileCheck2 size={14} />
                          Convert to SO
                        </button>
                      )}

                      {q.sales_order && (
                        <span
                          className="font-mono"
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--primary)',
                            padding: '4px 8px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          {q.sales_order.order_number}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE QUOTATION MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Commercial Quotation"
        maxWidth="820px"
      >
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              padding: '10px 14px',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleCreateQuotation}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Select Customer Enquiry <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                className="form-select"
                value={formEnquiryId}
                onChange={(e) => handleEnquirySelectChange(e.target.value)}
              >
                <option value="">Select Enquiry...</option>
                {enquiries.map((enq) => (
                  <option key={enq.id} value={enq.id}>
                    {enq.enquiry_number} - {enq.customer?.company_name} ({enq.items?.length || 0} items)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Quotation Validity Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                required
                className="form-input"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing Items Grid */}
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Quotation Pricing & Tax Rates
            </h4>

            <div className="table-container" style={{ maxHeight: '240px' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price (₹)</th>
                    <th>Discount %</th>
                    <th>GST %</th>
                    <th>Line Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteItems.map((it, idx) => {
                    const base = (it.quantity || 0) * (it.unit_price || 0);
                    const dAmt = base * ((it.discount_percent || 0) / 100);
                    const tax = base - dAmt;
                    const gst = tax * ((it.gst_percent || 18) / 100);
                    const lineEst = tax + gst;

                    return (
                      <tr key={idx}>
                        <td>
                          <select
                            required
                            className="form-select"
                            style={{ minWidth: '180px' }}
                            value={it.product_id}
                            onChange={(e) => handleItemFieldChange(idx, 'product_id', e.target.value)}
                          >
                            <option value="">Choose product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.product_code} - {p.product_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            required
                            min={1}
                            className="form-input"
                            style={{ width: '80px' }}
                            value={it.quantity}
                            onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            required
                            min={0}
                            step="0.01"
                            className="form-input"
                            style={{ width: '110px' }}
                            value={it.unit_price}
                            onChange={(e) => handleItemFieldChange(idx, 'unit_price', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            className="form-input"
                            style={{ width: '80px' }}
                            value={it.discount_percent}
                            onChange={(e) => handleItemFieldChange(idx, 'discount_percent', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step="0.1"
                            className="form-input"
                            style={{ width: '80px' }}
                            value={it.gst_percent}
                            onChange={(e) => handleItemFieldChange(idx, 'gst_percent', e.target.value)}
                          />
                        </td>
                        <td className="font-mono" style={{ fontWeight: 600, color: '#34d399' }}>
                          ₹{lineEst.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary Card */}
            <div
              style={{
                marginTop: '16px',
                background: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>SUBTOTAL</div>
                <div className="font-mono" style={{ fontWeight: 600 }}>₹{clientTotals.subtotal}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>TOTAL DISCOUNT</div>
                <div className="font-mono" style={{ fontWeight: 600, color: '#f87171' }}>-₹{clientTotals.discountTotal}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>TAXABLE VALUE</div>
                <div className="font-mono" style={{ fontWeight: 600 }}>₹{clientTotals.taxableTotal}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>TOTAL GST</div>
                <div className="font-mono" style={{ fontWeight: 600 }}>₹{clientTotals.gstTotal}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>GRAND TOTAL</div>
                <div className="font-mono" style={{ fontWeight: 800, color: '#34d399', fontSize: '1.1rem' }}>
                  ₹{clientTotals.grandTotal}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '-24px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              id="btn-submit-quotation"
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Calculating on Backend...' : 'Generate Quotation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QUOTATION BREAKDOWN DETAILS MODAL */}
      <Modal
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        title={`Quotation Pricing Breakdown: ${selectedQuote?.quotation_number}`}
        maxWidth="840px"
      >
        {selectedQuote && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                background: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>CLIENT COMPANY</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedQuote.customer?.company_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ref Enquiry: {selectedQuote.enquiry?.enquiry_number}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>STATUS</div>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedQuote.status} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Valid Until: {new Date(selectedQuote.valid_until).toLocaleDateString()}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
              Itemized Tax & Discount Calculation Table
            </h4>

            <div className="table-container" style={{ marginBottom: '20px' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Base Amount</th>
                    <th>Disc %</th>
                    <th>Taxable</th>
                    <th>GST</th>
                    <th>Line Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuote.items?.map((it) => {
                    const baseAmt = Number(it.quantity) * Number(it.unit_price);
                    const discAmt = baseAmt * (Number(it.discount_percent) / 100);
                    const taxable = baseAmt - discAmt;
                    const gstAmt = taxable * (Number(it.gst_percent) / 100);

                    return (
                      <tr key={it.id}>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                            {it.product?.product_code}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {it.product?.product_name}
                          </div>
                        </td>
                        <td className="font-mono">{it.quantity}</td>
                        <td className="font-mono">₹{Number(it.unit_price).toLocaleString('en-IN')}</td>
                        <td className="font-mono">₹{baseAmt.toLocaleString('en-IN')}</td>
                        <td className="font-mono" style={{ color: '#f87171' }}>{Number(it.discount_percent)}%</td>
                        <td className="font-mono">₹{taxable.toLocaleString('en-IN')}</td>
                        <td className="font-mono">{Number(it.gst_percent)}% (₹{gstAmt.toFixed(2)})</td>
                        <td className="font-mono" style={{ fontWeight: 700, color: '#34d399' }}>
                          ₹{Number(it.line_amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Authoritative Totals Breakdown */}
            <div
              style={{
                background: '#0d1424',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <div style={{ width: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                  <span className="font-mono">₹{Number(selectedQuote.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Discount:</span>
                  <span className="font-mono" style={{ color: '#f87171' }}>
                    -₹{Number(selectedQuote.total_discount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Taxable Amount:</span>
                  <span className="font-mono">₹{Number(selectedQuote.taxable_amount).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>GST:</span>
                  <span className="font-mono">₹{Number(selectedQuote.total_gst).toLocaleString('en-IN')}</span>
                </div>
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: '#34d399',
                  }}
                >
                  <span>Grand Total:</span>
                  <span className="font-mono">₹{Number(selectedQuote.grand_total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '-24px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedQuote(null)}
              >
                Close
              </button>

              {selectedQuote.status === 'ACCEPTED' && !selectedQuote.sales_order && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const q = selectedQuote;
                    setSelectedQuote(null);
                    handleConvertToOrder(q);
                  }}
                >
                  Convert to Sales Order
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
