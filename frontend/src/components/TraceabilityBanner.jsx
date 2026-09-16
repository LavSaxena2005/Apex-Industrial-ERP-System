import React from 'react';
import {
  Users,
  HelpCircle,
  FileSpreadsheet,
  ShoppingCart,
  Lock,
  Truck,
  CheckCircle2,
} from 'lucide-react';

const STEP_ICONS = [
  Users,
  HelpCircle,
  FileSpreadsheet,
  ShoppingCart,
  Lock,
  Truck,
];

export const TraceabilityBanner = ({ activeStage = 1, metadata = {} }) => {
  const steps = [
    {
      num: 1,
      title: 'Customer',
      sub: metadata.customerName || 'ABC Engineering',
    },
    {
      num: 2,
      title: 'Enquiry',
      sub: metadata.enquiryNumber || 'ENQ-0001',
    },
    {
      num: 3,
      title: 'Quotation',
      sub: metadata.quotationNumber || 'QUO-0001',
    },
    {
      num: 4,
      title: 'Sales Order',
      sub: metadata.orderNumber || 'SO-0001',
    },
    {
      num: 5,
      title: 'Stock Reservation',
      sub: metadata.reservedStatus || (activeStage >= 5 ? 'Reserved' : 'Pending'),
    },
    {
      num: 6,
      title: 'Dispatch',
      sub: metadata.dispatchNumber || (activeStage >= 6 ? 'Dispatched' : 'Pending'),
    },
  ];

  return (
    <div className="stepper-container">
      <div className="stepper-title">
        <CheckCircle2 size={16} color="var(--primary)" />
        Industrial ERP Traceability Lifecycle
      </div>
      <div className="stepper-track">
        <div
          className="stepper-line"
          style={{
            background: `linear-gradient(to right, #10b981 ${Math.min(
              100,
              ((activeStage - 1) / 5) * 100
            )}%, #1e293b ${Math.min(100, ((activeStage - 1) / 5) * 100)}%)`,
          }}
        />
        {steps.map((s, idx) => {
          const Icon = STEP_ICONS[idx];
          const isCompleted = s.num < activeStage;
          const isActive = s.num === activeStage;

          return (
            <div key={s.num} className="stepper-step">
              <div
                className={`stepper-circle ${
                  isCompleted ? 'completed' : isActive ? 'active' : ''
                }`}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={16} />}
              </div>
              <div
                className="stepper-label"
                style={{
                  color: isActive
                    ? 'var(--primary)'
                    : isCompleted
                    ? 'var(--text-main)'
                    : 'var(--text-dim)',
                }}
              >
                {s.title}
              </div>
              <div className="stepper-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
