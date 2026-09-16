import React from 'react';
import {
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LockIcon from '@mui/icons-material/Lock';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const STEPS = [
  { title: 'Customer',          icon: PeopleAltIcon },
  { title: 'Enquiry',           icon: HelpOutlineIcon },
  { title: 'Quotation',         icon: DescriptionIcon },
  { title: 'Sales Order',       icon: ShoppingCartIcon },
  { title: 'Stock Reservation', icon: LockIcon },
  { title: 'Dispatch',          icon: LocalShippingIcon },
];

const ColorConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 18 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: theme.palette.primary.main },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: theme.palette.success.main },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#e5e7eb',
    borderTopWidth: 2,
  },
}));

const ColorStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  border: '2px solid',
  borderColor: ownerState.completed
    ? theme.palette.success.main
    : ownerState.active
    ? theme.palette.primary.main
    : '#d1d5db',
  backgroundColor: ownerState.completed
    ? theme.palette.success.main
    : ownerState.active
    ? '#eff6ff'
    : '#f9fafb',
  color: ownerState.completed
    ? '#ffffff'
    : ownerState.active
    ? theme.palette.primary.main
    : '#9ca3af',
  transition: 'all 0.2s ease',
}));

function ColorStepIcon({ active, completed, icon }) {
  const Icon = STEPS[Number(icon) - 1]?.icon || PeopleAltIcon;
  return (
    <ColorStepIconRoot ownerState={{ active, completed }}>
      <Icon fontSize="small" />
    </ColorStepIconRoot>
  );
}

export const TraceabilityBanner = ({ activeStage = 1, metadata = {} }) => {
  const subLabels = [
    metadata.customerName || '—',
    metadata.enquiryNumber || '—',
    metadata.quotationNumber || '—',
    metadata.orderNumber || '—',
    metadata.reservedStatus || (activeStage >= 5 ? 'Reserved' : '—'),
    metadata.dispatchNumber || (activeStage >= 6 ? 'Dispatched' : '—'),
  ];

  return (
    <Paper
      variant="outlined"
      sx={{ px: 3, py: 2, mb: 3, borderRadius: 2, bgcolor: '#ffffff' }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 700,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          mb: 2,
        }}
      >
        ERP Traceability Pipeline
      </Typography>
      <Stepper
        alternativeLabel
        activeStep={activeStage - 1}
        connector={<ColorConnector />}
      >
        {STEPS.map((step, idx) => (
          <Step key={step.title}>
            <StepLabel
              StepIconComponent={ColorStepIcon}
              optional={
                <Typography variant="caption" color="text.secondary" noWrap>
                  {subLabels[idx]}
                </Typography>
              }
            >
              <Typography variant="caption" fontWeight={600} noWrap>
                {step.title}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};
