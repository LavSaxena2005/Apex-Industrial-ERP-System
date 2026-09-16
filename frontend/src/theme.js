import { createTheme, alpha } from '@mui/material/styles';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#dc2626', // Primary Action Red (Tailwind red-600)
      light: '#ef4444',
      dark: '#b91c1c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4b5563', // Dark Gray for secondary actions
      contrastText: '#ffffff',
    },
    error: { main: '#dc2626' },
    warning: { main: '#f59e0b' },
    success: { main: '#10b981' },
    background: {
      default: '#f9fafb', // Very light gray workspace backing
      paper: '#ffffff',   // Clean white for cards/surfaces
    },
    text: {
      primary: '#111928', // Dark text for important info
      secondary: '#6b7280', // Muted text
    },
    divider: '#e5e7eb', // Light gray for structure/borders
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: 0,
    },
  },
  shape: {
    borderRadius: 6, // Small corner radius
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',
    '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.05)',
    '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.05)',
    '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
    '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    ...Array(18).fill('none'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        body { background-color: #f9fafb; color: #111928; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f9fafb; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          padding: '8px 16px',
        },
        containedPrimary: {
          backgroundColor: '#dc2626',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#b91c1c',
          },
        },
        outlinedPrimary: {
          borderColor: '#dc2626',
          color: '#dc2626',
          backgroundColor: '#ffffff',
          '&:hover': {
            backgroundColor: 'rgba(220, 38, 38, 0.04)',
            borderColor: '#b91c1c',
          },
        },
        outlinedSecondary: {
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          color: '#374151',
          '&:hover': {
            backgroundColor: '#f3f4f6',
            borderColor: '#d1d5db',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', // Minimal shadow
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#ffffff',
            color: '#6b7280',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #e5e7eb',
            paddingTop: '12px',
            paddingBottom: '12px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#e5e7eb',
          padding: '12px 16px',
          fontSize: '0.875rem',
          color: '#111928',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f9fafb',
          },
          '&:last-child td': {
            borderBottom: 'none',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.72rem',
          height: 24,
          borderRadius: 4,
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            fontSize: '0.875rem',
            borderRadius: 6,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#dc2626', // Red border on focus
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: 6,
          fontSize: '0.875rem',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#dc2626',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: '#d1d5db',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
});

export default theme;
