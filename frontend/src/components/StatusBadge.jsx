import React from 'react';
import Chip from '@mui/material/Chip';

const STATUS_CONFIG = {
  NEW:        { label: 'New',         bgcolor: '#e0f2fe', color: '#0369a1' },
  QUOTED:     { label: 'Quoted',      bgcolor: '#ede9fe', color: '#6d28d9' },
  WON:        { label: 'Won',         bgcolor: '#dcfce7', color: '#15803d' },
  LOST:       { label: 'Lost',        bgcolor: '#fee2e2', color: '#b91c1c' },

  DRAFT:      { label: 'Draft',       bgcolor: '#fef9c3', color: '#92400e' },
  SENT:       { label: 'Sent',        bgcolor: '#dbeafe', color: '#1d4ed8' },
  ACCEPTED:   { label: 'Accepted',    bgcolor: '#dcfce7', color: '#15803d' },
  REJECTED:   { label: 'Rejected',    bgcolor: '#fee2e2', color: '#b91c1c' },

  PENDING:    { label: 'Pending',     bgcolor: '#fef3c7', color: '#92400e' },
  CONFIRMED:  { label: 'Confirmed',   bgcolor: '#dbeafe', color: '#1d4ed8' },
  RESERVED:   { label: 'Reserved',    bgcolor: '#d1fae5', color: '#065f46' },
  DISPATCHED: { label: 'Dispatched',  bgcolor: '#dcfce7', color: '#15803d' },
  CANCELLED:  { label: 'Cancelled',   bgcolor: '#fee2e2', color: '#b91c1c' },
};

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    bgcolor: '#f3f4f6',
    color: '#374151',
  };

  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: cfg.bgcolor,
        color: cfg.color,
        fontWeight: 700,
        fontSize: '0.72rem',
        height: 22,
        borderRadius: '6px',
        '& .MuiChip-label': { px: '8px' },
      }}
    />
  );
};
