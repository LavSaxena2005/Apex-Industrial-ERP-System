import React from 'react';

const STATUS_CONFIG = {
  NEW: { class: 'badge-new', dotColor: '#38bdf8', label: 'NEW' },
  QUOTED: { class: 'badge-quoted', dotColor: '#c084fc', label: 'QUOTED' },
  WON: { class: 'badge-won', dotColor: '#34d399', label: 'WON' },
  LOST: { class: 'badge-lost', dotColor: '#f87171', label: 'LOST' },

  DRAFT: { class: 'badge-draft', dotColor: '#fbbf24', label: 'DRAFT' },
  SENT: { class: 'badge-sent', dotColor: '#60a5fa', label: 'SENT' },
  ACCEPTED: { class: 'badge-accepted', dotColor: '#34d399', label: 'ACCEPTED' },
  REJECTED: { class: 'badge-rejected', dotColor: '#f87171', label: 'REJECTED' },

  PENDING: { class: 'badge-pending', dotColor: '#fbbf24', label: 'PENDING' },
  CONFIRMED: { class: 'badge-confirmed', dotColor: '#60a5fa', label: 'CONFIRMED' },
  DISPATCHED: { class: 'badge-dispatched', dotColor: '#34d399', label: 'DISPATCHED' },
  CANCELLED: { class: 'badge-cancelled', dotColor: '#f87171', label: 'CANCELLED' },
};

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    class: 'badge-draft',
    dotColor: '#94a3b8',
    label: status,
  };

  return (
    <span className={`badge ${config.class}`}>
      <span
        className="badge-dot"
        style={{
          backgroundColor: config.dotColor,
          boxShadow: `0 0 6px ${config.dotColor}`,
        }}
      />
      {config.label}
    </span>
  );
};
