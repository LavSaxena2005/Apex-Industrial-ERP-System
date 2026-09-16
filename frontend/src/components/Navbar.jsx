import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Factory,
  FileQuestion,
  Receipt,
  ShoppingCart,
  Boxes,
  LogOut,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, quickLogin, isAdmin } = useAuth();

  const handleRoleToggle = async () => {
    if (isAdmin) {
      await quickLogin('SALES_USER');
    } else {
      await quickLogin('ADMIN');
    }
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <div className="brand">
          <div className="brand-icon">
            <Factory size={22} color="#ffffff" />
          </div>
          <div className="brand-text">
            <h1>Apex Industrial ERP</h1>
            <span>Sales & Inventory System</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav>
          <ul className="nav-links">
            <li>
              <button
                id="nav-enquiries"
                className={`nav-btn ${activeTab === 'enquiries' ? 'active' : ''}`}
                onClick={() => setActiveTab('enquiries')}
              >
                <FileQuestion size={18} />
                Enquiries
              </button>
            </li>
            <li>
              <button
                id="nav-quotations"
                className={`nav-btn ${activeTab === 'quotations' ? 'active' : ''}`}
                onClick={() => setActiveTab('quotations')}
              >
                <Receipt size={18} />
                Quotations
              </button>
            </li>
            <li>
              <button
                id="nav-sales-orders"
                className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingCart size={18} />
                Sales Orders & Dispatch
              </button>
            </li>
            <li>
              <button
                id="nav-inventory"
                className={`nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('inventory')}
              >
                <Boxes size={18} />
                Inventory Master
              </button>
            </li>
          </ul>
        </nav>

        {/* User Info & Role Switcher */}
        <div className="nav-user">
          {/* Quick Demo Switcher */}
          <button
            id="btn-switch-role"
            onClick={handleRoleToggle}
            className="btn btn-secondary btn-sm"
            title="Instantly toggle between ADMIN and SALES_USER for testing"
            style={{ fontSize: '0.75rem', gap: '6px' }}
          >
            <RefreshCw size={13} />
            Switch to {isAdmin ? 'Sales User' : 'Admin'}
          </button>

          <div className="user-badge">
            {isAdmin ? <Shield size={16} color="#c084fc" /> : <User size={16} color="#38bdf8" />}
            <span style={{ fontWeight: 600 }}>{user?.name || 'User'}</span>
            <span className={`role-pill ${isAdmin ? 'role-admin' : 'role-sales'}`}>
              {user?.role}
            </span>
          </div>

          <button
            id="btn-logout"
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Sign Out"
            style={{ padding: '6px 10px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
