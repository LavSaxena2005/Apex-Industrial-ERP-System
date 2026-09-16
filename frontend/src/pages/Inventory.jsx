import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  Boxes,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Search,
  Filter,
  TrendingUp,
} from 'lucide-react';

export const Inventory = () => {
  const { isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Edit Stock Modal
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

  useEffect(() => {
    fetchInventory();
  }, []);

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

  // KPIs
  const totalPhysical = inventory.reduce((acc, i) => acc + (i.physical_quantity || 0), 0);
  const totalReserved = inventory.reduce((acc, i) => acc + (i.reserved_quantity || 0), 0);
  const totalAvailable = totalPhysical - totalReserved;

  const categories = ['ALL', ...new Set(inventory.map((i) => i.category))];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.product_code.toLowerCase().includes(search.toLowerCase()) ||
      item.product_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div>
      {/* Metric Cards Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              TOTAL CATALOG PRODUCTS
            </span>
            <Boxes size={20} color="var(--primary)" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>
            {inventory.length}
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              PHYSICAL STOCK
            </span>
            <Package size={20} color="#38bdf8" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>
            {totalPhysical} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>units</span>
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              RESERVED FOR ORDERS
            </span>
            <Layers size={20} color="#f59e0b" />
          </div>
          <div
            className="font-mono"
            style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}
          >
            {totalReserved} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>units</span>
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              AVAILABLE TO SELL
            </span>
            <TrendingUp size={20} color="#10b981" />
          </div>
          <div
            className="font-mono"
            style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}
          >
            {totalAvailable} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>units</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Boxes size={22} color="var(--primary)" />
              Inventory & Availability Master
            </h2>
            <p className="card-desc">
              Formula: Available Quantity = Physical Quantity − Reserved Quantity (Real-time computed).
            </p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchInventory}
            title="Refresh Stock Availability"
          >
            Refresh Stock
          </button>
        </div>

        {/* Filters */}
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
              placeholder="Search product code or name..."
              style={{ paddingLeft: '36px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--text-dim)" />
            <select
              className="form-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ width: '160px' }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading stock status...
          </div>
        ) : filteredInventory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No inventory records found.
          </div>
        ) : (
          <div className="table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Product Code</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Base Price</th>
                  <th>Physical Stock</th>
                  <th>Reserved Stock</th>
                  <th>Available Stock</th>
                  <th>Stock Health</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Admin Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const avail = item.available_quantity;
                  const isHealthy = avail > 20;
                  const isLow = avail > 0 && avail <= 20;
                  const isDepleted = avail <= 0;

                  return (
                    <tr key={item.id}>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {item.product_code}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                      <td>
                        <span
                          style={{
                            background: 'var(--bg-subtle)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                          }}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="font-mono">{item.unit}</td>
                      <td className="font-mono">₹{Number(item.base_price).toLocaleString('en-IN')}</td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {item.physical_quantity}
                      </td>
                      <td className="font-mono" style={{ color: '#fbbf24', fontWeight: 600 }}>
                        {item.reserved_quantity}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 800, fontSize: '1rem' }}>
                        <span style={{ color: isHealthy ? '#34d399' : isLow ? '#fbbf24' : '#f87171' }}>
                          {avail}
                        </span>
                      </td>
                      <td>
                        {isHealthy && (
                          <span className="stock-badge-green" style={{ fontSize: '0.75rem' }}>
                            ● Optimal
                          </span>
                        )}
                        {isLow && (
                          <span
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            ▲ Low Stock
                          </span>
                        )}
                        {isDepleted && (
                          <span className="stock-badge-red" style={{ fontSize: '0.75rem' }}>
                            ✖ Out of Stock
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(item)}
                            title="Adjust Physical Inventory"
                          >
                            <Edit size={13} />
                            Adjust Stock
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADJUST PHYSICAL STOCK MODAL */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Adjust Physical Stock: ${editingItem?.product_code}`}
        maxWidth="480px"
      >
        {editError && (
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
            {editError}
          </div>
        )}

        <form onSubmit={handleSaveStock}>
          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '14px',
              borderRadius: '8px',
              marginBottom: '18px',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ fontWeight: 600 }}>{editingItem?.product_name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
              Current Reserved Units: <strong>{editingItem?.reserved_quantity}</strong>
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '4px' }}>
              * Physical stock cannot be set below currently reserved units ({editingItem?.reserved_quantity}).
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              New Physical Quantity <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              required
              min={editingItem?.reserved_quantity || 0}
              className="form-input"
              value={physicalQty}
              onChange={(e) => setPhysicalQty(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ margin: '-24px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Updating...' : 'Save Stock Quantity'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
