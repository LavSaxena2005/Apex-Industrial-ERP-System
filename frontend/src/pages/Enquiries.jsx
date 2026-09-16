import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  FileQuestion,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Search,
  Filter,
} from 'lucide-react';

export const Enquiries = ({ onNavigateToQuotation }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    required_date: '',
    notes: '',
    items: [{ product_id: '', quantity: 1 }],
  });

  // New Customer Form State
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

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1 }],
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
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
      const payload = {
        customer_id: formData.customer_id,
        required_date: formData.required_date,
        notes: formData.notes,
        items: formData.items.map((it) => ({
          product_id: parseInt(it.product_id, 10),
          quantity: parseInt(it.quantity, 10),
        })),
      };

      await api.createEnquiry(payload);
      setIsCreateOpen(false);
      setFormData({
        customer_id: '',
        required_date: '',
        notes: '',
        items: [{ product_id: '', quantity: 1 }],
      });
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
      setNewCustomer({
        company_name: '',
        contact_person: '',
        mobile: '',
        email: '',
        city: '',
      });
    } catch (err) {
      alert(err.message || 'Failed to create customer');
    }
  };

  const filteredEnquiries = enquiries.filter((enq) => {
    const matchesSearch =
      enq.enquiry_number.toLowerCase().includes(search.toLowerCase()) ||
      enq.customer?.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || enq.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <FileQuestion size={22} color="var(--primary)" />
            Customer Enquiries
          </h2>
          <p className="card-desc">
            Manage incoming customer demand and specifications with multi-product items.
          </p>
        </div>

        <button
          id="btn-create-enquiry"
          className="btn btn-primary"
          onClick={() => {
            setSubmitError('');
            setIsCreateOpen(true);
          }}
        >
          <Plus size={18} />
          Create Enquiry
        </button>
      </div>

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
            placeholder="Search by enquiry number or company name..."
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
            <option value="NEW">NEW</option>
            <option value="QUOTED">QUOTED</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading enquiries...
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
          No customer enquiries found matching your criteria.
        </div>
      ) : (
        <div className="table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Enquiry #</th>
                <th>Customer Name</th>
                <th>Enquiry Date</th>
                <th>Required Date</th>
                <th>Total Items</th>
                <th>Status</th>
                <th>Created By</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((enq) => (
                <tr key={enq.id}>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {enq.enquiry_number}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{enq.customer?.company_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {enq.customer?.contact_person} • {enq.customer?.city}
                    </div>
                  </td>
                  <td className="font-mono">
                    {new Date(enq.enquiry_date).toLocaleDateString()}
                  </td>
                  <td className="font-mono">
                    {new Date(enq.required_date).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      style={{
                        background: 'var(--bg-subtle)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      {enq.items?.length || 0} Products
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={enq.status} />
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {enq.creator?.name}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedEnquiry(enq)}
                      >
                        View Details
                      </button>
                      {onNavigateToQuotation && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onNavigateToQuotation(enq)}
                          title="Generate Quotation against this Enquiry"
                        >
                          Quote
                          <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE ENQUIRY MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Customer Enquiry"
        maxWidth="740px"
      >
        {submitError && (
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
            {submitError}
          </div>
        )}

        <form onSubmit={handleCreateEnquiry}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Customer <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  required
                  className="form-select"
                  value={formData.customer_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customer_id: e.target.value }))
                  }
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.city})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCustomerModalOpen(true)}
                  title="Add New Customer"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + New
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Required By Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.required_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, required_date: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Project / Requirement Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="E.g. Requirement for turbine overhaul; test certificates required."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Product Items Table */}
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <label className="form-label" style={{ marginBottom: 0 }}>
                Products Required <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItem}
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px' }}>
              {formData.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr auto',
                    gap: '12px',
                    padding: '10px',
                    alignItems: 'center',
                    borderBottom:
                      idx < formData.items.length - 1
                        ? '1px solid var(--border-color)'
                        : 'none',
                    background: idx % 2 === 0 ? 'var(--bg-app)' : 'var(--bg-subtle)',
                  }}
                >
                  <div>
                    <select
                      required
                      className="form-select"
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)}
                    >
                      <option value="">Select Industrial Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.product_code} - {p.product_name} ({p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      required
                      min={1}
                      className="form-input"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={formData.items.length === 1}
                      onClick={() => handleRemoveItem(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: formData.items.length === 1 ? 'var(--text-dim)' : '#ef4444',
                        cursor: formData.items.length === 1 ? 'not-allowed' : 'pointer',
                        padding: '6px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
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
              id="submit-enquiry-btn"
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Creating...' : 'Create Enquiry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QUICK ADD CUSTOMER MODAL */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Add New Business Customer"
        maxWidth="520px"
      >
        <form onSubmit={handleCreateCustomer}>
          <div className="form-group">
            <label className="form-label">Company Name *</label>
            <input
              required
              className="form-input"
              value={newCustomer.company_name}
              onChange={(e) =>
                setNewCustomer((prev) => ({ ...prev, company_name: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person *</label>
            <input
              required
              className="form-input"
              value={newCustomer.contact_person}
              onChange={(e) =>
                setNewCustomer((prev) => ({ ...prev, contact_person: e.target.value }))
              }
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Mobile *</label>
              <input
                required
                className="form-input"
                value={newCustomer.mobile}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, mobile: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                required
                className="form-input"
                value={newCustomer.city}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              required
              className="form-input"
              value={newCustomer.email}
              onChange={(e) =>
                setNewCustomer((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <div className="modal-footer" style={{ margin: '-24px', marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCustomerModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* ENQUIRY DETAILS MODAL */}
      <Modal
        isOpen={!!selectedEnquiry}
        onClose={() => setSelectedEnquiry(null)}
        title={`Enquiry Details: ${selectedEnquiry?.enquiry_number}`}
        maxWidth="680px"
      >
        {selectedEnquiry && (
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Customer
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {selectedEnquiry.customer?.company_name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {selectedEnquiry.customer?.contact_person} • {selectedEnquiry.customer?.mobile}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  {selectedEnquiry.customer?.city}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Lifecycle Status
                </div>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedEnquiry.status} />
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Enquiry Date: {new Date(selectedEnquiry.enquiry_date).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Required Date: {new Date(selectedEnquiry.required_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            {selectedEnquiry.notes && (
              <div
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Notes: </span>
                {selectedEnquiry.notes}
              </div>
            )}

            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
              Enquiry Product Line Items ({selectedEnquiry.items?.length || 0})
            </h4>

            <div className="table-container" style={{ marginBottom: '20px' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Required Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEnquiry.items?.map((it) => (
                    <tr key={it.id}>
                      <td className="font-mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {it.product?.product_code}
                      </td>
                      <td>{it.product?.product_name}</td>
                      <td>{it.product?.category}</td>
                      <td className="font-mono" style={{ fontWeight: 700 }}>
                        {it.quantity} {it.product?.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer" style={{ margin: '-24px', marginTop: '16px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedEnquiry(null)}
              >
                Close
              </button>
              {onNavigateToQuotation && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const enq = selectedEnquiry;
                    setSelectedEnquiry(null);
                    onNavigateToQuotation(enq);
                  }}
                >
                  Create Quotation for this Enquiry
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
