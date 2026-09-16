import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { TraceabilityBanner } from '../components/TraceabilityBanner';
import {
  ShoppingCart,
  Lock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Info,
  Search,
  Filter,
} from 'lucide-react';

export const SalesOrders = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals & Details
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [traceModalOrder, setTraceModalOrder] = useState(null);
  const [traceData, setTraceData] = useState(null);

  // Dispatch Form
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchError, setDispatchError] = useState('');
  const [dispatching, setDispatching] = useState(false);

  // Notification
  const [alertInfo, setAlertInfo] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordRes, invRes] = await Promise.all([
        api.getSalesOrders(),
        api.getInventory(),
      ]);
      setOrders(ordRes.data || []);
      setInventory(invRes.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmReservation = async (orderId) => {
    try {
      setAlertInfo(null);
      const res = await api.confirmSalesOrder(orderId);
      setAlertInfo({
        type: 'success',
        message: `Sales Order confirmed! Inventory reserved via PostgreSQL row locks (SELECT ... FOR UPDATE).`,
      });
      fetchData();
    } catch (err) {
      setAlertInfo({
        type: 'error',
        message: err.message || 'Failed to reserve inventory for Sales Order.',
      });
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
      const res = await api.dispatchSalesOrder(dispatchModalOrder.id, {
        vehicle_number: vehicleNumber,
        driver_name: driverName,
      });

      setDispatchModalOrder(null);
      setAlertInfo({
        type: 'success',
        message: `Order dispatched under ${res.data.dispatch?.dispatch_number}! Physical and reserved inventory decremented atomically.`,
      });
      fetchData();
    } catch (err) {
      setDispatchError(err.message || 'Dispatch processing failed.');
    } finally {
      setDispatching(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this Sales Order? Any reserved stock will be returned.')) {
      return;
    }

    try {
      await api.cancelSalesOrder(orderId);
      setAlertInfo({
        type: 'info',
        message: 'Sales Order cancelled and any reserved stock released back to inventory.',
      });
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
      console.error('Error fetching traceability:', err);
    }
  };

  // Helper to verify item availability from local inventory cache
  const checkStockSufficiency = (order) => {
    if (order.status !== 'PENDING') return null;

    let allAvailable = true;
    for (const it of order.items || []) {
      const inv = inventory.find((invItem) => invItem.product_id === it.product_id);
      if (!inv || inv.available_quantity < it.quantity) {
        allAvailable = false;
        break;
      }
    }
    return allAvailable;
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.company_name.toLowerCase().includes(search.toLowerCase()) ||
      o.quotation?.quotation_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Top Banner Traceability Preview */}
      <TraceabilityBanner activeStage={4} metadata={{ orderNumber: 'SO-0001' }} />

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <ShoppingCart size={22} color="var(--primary)" />
              Sales Orders & Dispatch Execution
            </h2>
            <p className="card-desc">
              Manage confirmed orders, trigger concurrency-safe stock reservation, and process dispatches.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.8rem',
                color: isAdmin ? '#c084fc' : '#38bdf8',
                background: 'var(--bg-subtle)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Role: {isAdmin ? 'ADMIN (Full Execution)' : 'SALES USER (Read-Only Orders)'}
            </span>
          </div>
        </div>

        {/* Dynamic Alert Banner */}
        {alertInfo && (
          <div
            style={{
              background:
                alertInfo.type === 'success'
                  ? 'var(--success-bg)'
                  : alertInfo.type === 'error'
                  ? 'var(--danger-bg)'
                  : 'var(--info-bg)',
              border: `1px solid ${
                alertInfo.type === 'success'
                  ? 'var(--success-border)'
                  : alertInfo.type === 'error'
                  ? 'var(--danger-border)'
                  : 'var(--info-border)'
              }`,
              borderRadius: '8px',
              padding: '14px 18px',
              color:
                alertInfo.type === 'success'
                  ? '#34d399'
                  : alertInfo.type === 'error'
                  ? '#f87171'
                  : '#38bdf8',
              fontSize: '0.9rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {alertInfo.type === 'success' && <CheckCircle2 size={18} />}
              {alertInfo.type === 'error' && <AlertTriangle size={18} />}
              {alertInfo.type === 'info' && <Info size={18} />}
              <span>{alertInfo.message}</span>
            </div>
            <button
              onClick={() => setAlertInfo(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
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
              placeholder="Search by order #, customer, quotation..."
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
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED (Reserved)</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading sales orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No sales orders found matching your criteria.
          </div>
        ) : (
          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Quotation Ref</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Stock Readiness</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const isStockSufficient = checkStockSufficiency(ord);

                  return (
                    <tr key={ord.id}>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {ord.order_number}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ord.customer?.company_name}</div>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                        {ord.quotation?.quotation_number}
                      </td>
                      <td className="font-mono">
                        {new Date(ord.order_date).toLocaleDateString()}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 700 }}>
                        ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <StatusBadge status={ord.status} />
                      </td>
                      <td>
                        {ord.status === 'PENDING' ? (
                          isStockSufficient ? (
                            <span className="stock-badge-green" style={{ fontSize: '0.75rem' }}>
                              ● Stock Available
                            </span>
                          ) : (
                            <span className="stock-badge-red" style={{ fontSize: '0.75rem' }}>
                              ▲ Stock Shortage
                            </span>
                          )
                        ) : ord.status === 'CONFIRMED' ? (
                          <span
                            style={{
                              color: '#60a5fa',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            ✓ Stock Reserved
                          </span>
                        ) : ord.status === 'DISPATCHED' ? (
                          <span
                            style={{
                              color: '#34d399',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            ✓ Delivered / Dispatched
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedOrder(ord)}
                            title="View Items"
                          >
                            <Eye size={13} />
                            Items
                          </button>

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenTraceability(ord)}
                            title="Audit Traceability Trail"
                          >
                            Audit
                          </button>

                          {/* ADMIN: Confirm Order (Stock Reservation) */}
                          {ord.status === 'PENDING' && (
                            <button
                              id={`btn-confirm-${ord.id}`}
                              disabled={!isAdmin}
                              className="btn btn-primary btn-sm"
                              onClick={() => handleConfirmReservation(ord.id)}
                              title={
                                isAdmin
                                  ? 'Confirm Order & Reserve Stock (SELECT ... FOR UPDATE)'
                                  : 'Requires ADMIN role'
                              }
                            >
                              <Lock size={13} />
                              Confirm & Reserve
                            </button>
                          )}

                          {/* ADMIN: Dispatch Order */}
                          {ord.status === 'CONFIRMED' && (
                            <button
                              id={`btn-dispatch-${ord.id}`}
                              disabled={!isAdmin}
                              className="btn btn-success btn-sm"
                              onClick={() => handleOpenDispatch(ord)}
                              title={isAdmin ? 'Process Dispatch' : 'Requires ADMIN role'}
                            >
                              <Truck size={13} />
                              Dispatch
                            </button>
                          )}

                          {/* ADMIN: Cancel Order */}
                          {(ord.status === 'PENDING' || ord.status === 'CONFIRMED') && (
                            <button
                              disabled={!isAdmin}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#f87171' }}
                              onClick={() => handleCancelOrder(ord.id)}
                              title={isAdmin ? 'Cancel Order & Release Stock' : 'Requires ADMIN role'}
                            >
                              <XCircle size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER ITEMS DETAIL MODAL */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Sales Order Line Items: ${selectedOrder?.order_number}`}
        maxWidth="740px"
      >
        {selectedOrder && (
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>CUSTOMER</div>
                <div style={{ fontWeight: 700 }}>{selectedOrder.customer?.company_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Quotation: {selectedOrder.quotation?.quotation_number}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ORDER STATUS</div>
                <div style={{ marginTop: '4px' }}>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, marginTop: '6px' }}>
                  ₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Products & Stock Status
            </h4>

            <div className="table-container" style={{ marginBottom: '20px' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Ordered Qty</th>
                    <th>Unit Price</th>
                    <th>Live Available Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((it) => {
                    const inv = inventory.find((i) => i.product_id === it.product_id);
                    const avail = inv ? inv.available_quantity : 0;
                    const isEnough = avail >= it.quantity;

                    return (
                      <tr key={it.id}>
                        <td className="font-mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {it.product?.product_code}
                        </td>
                        <td>{it.product?.product_name}</td>
                        <td className="font-mono" style={{ fontWeight: 700 }}>
                          {it.quantity} {it.product?.unit}
                        </td>
                        <td className="font-mono">₹{Number(it.unit_price).toLocaleString('en-IN')}</td>
                        <td>
                          {selectedOrder.status === 'PENDING' ? (
                            <span
                              className={isEnough ? 'stock-badge-green' : 'stock-badge-red'}
                              style={{ fontSize: '0.78rem' }}
                            >
                              {avail} units available
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                              Reserved for Order
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Dispatches History */}
            {selectedOrder.dispatches && selectedOrder.dispatches.length > 0 && (
              <div
                style={{
                  background: '#0d1424',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={16} /> Dispatch Confirmation Log
                </div>
                {selectedOrder.dispatches.map((d) => (
                  <div key={d.id} style={{ fontSize: '0.85rem' }}>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {d.dispatch_number}
                    </span>{' '}
                    dispatched on {new Date(d.dispatch_date).toLocaleDateString()} | Vehicle:{' '}
                    <strong>{d.vehicle_number}</strong> | Driver: <strong>{d.driver_name}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-footer" style={{ margin: '-24px', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DISPATCH PROCESSING MODAL */}
      <Modal
        isOpen={!!dispatchModalOrder}
        onClose={() => setDispatchModalOrder(null)}
        title={`Process Dispatch: ${dispatchModalOrder?.order_number}`}
        maxWidth="540px"
      >
        {dispatchError && (
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
            {dispatchError}
          </div>
        )}

        <form onSubmit={handleProcessDispatch}>
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '18px',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ fontWeight: 600 }}>Destination: {dispatchModalOrder?.customer?.company_name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              City: {dispatchModalOrder?.customer?.city}
            </div>
            <div style={{ color: '#38bdf8', fontSize: '0.8rem', marginTop: '6px' }}>
              Total Products: {dispatchModalOrder?.items?.length} | Physical & Reserved stock will decrement automatically.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Logistics Vehicle Number <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              required
              className="form-input"
              placeholder="e.g. MH-12-AB-1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Assigned Driver Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              required
              className="form-input"
              placeholder="e.g. Ramesh Patil"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '-24px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDispatchModalOrder(null)}
            >
              Cancel
            </button>
            <button
              id="btn-confirm-dispatch"
              type="submit"
              disabled={dispatching}
              className="btn btn-success"
            >
              <Truck size={16} />
              {dispatching ? 'Processing Dispatch...' : 'Confirm Dispatch & Deduct Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* FULL TRACEABILITY AUDIT MODAL */}
      <Modal
        isOpen={!!traceModalOrder}
        onClose={() => setTraceModalOrder(null)}
        title={`Audit Trail: ${traceModalOrder?.order_number}`}
        maxWidth="740px"
      >
        {traceData ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <TraceabilityBanner
                activeStage={
                  traceData.dispatches?.length > 0
                    ? 6
                    : traceData.salesOrder?.status === 'CONFIRMED'
                    ? 5
                    : 4
                }
                metadata={{
                  customerName: traceData.customer?.company_name,
                  enquiryNumber: traceData.enquiry?.enquiry_number,
                  quotationNumber: traceData.quotation?.quotation_number,
                  orderNumber: traceData.salesOrder?.order_number,
                  reservedStatus:
                    traceData.salesOrder?.status === 'CONFIRMED' || traceData.salesOrder?.status === 'DISPATCHED'
                      ? 'Reserved'
                      : 'Pending',
                  dispatchNumber: traceData.dispatches?.[0]?.dispatch_number,
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {traceData.steps?.map((st) => (
                <div
                  key={st.step}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Step {st.step}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{st.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {st.data ? JSON.stringify(st.data) : 'Not initiated'}
                    </div>
                  </div>
                  <div>
                    {st.completed ? (
                      <span className="badge badge-won">Completed</span>
                    ) : (
                      <span className="badge badge-draft">Pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer" style={{ margin: '-24px', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setTraceModalOrder(null)}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Loading audit lineage...
          </div>
        )}
      </Modal>
    </div>
  );
};
