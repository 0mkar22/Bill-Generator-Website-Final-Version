import { createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // accent Indigo
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#34d399', // status Paid emerald
      light: '#6ee7b7',
      dark: '#059669',
      contrastText: '#09090b',
    },
    background: {
      default: '#09090b', // strictly zinc-950 (never pure black)
      paper: '#131315',   // surface
    },
    text: {
      primary: '#f4f4f5', // zinc-100
      secondary: '#a1a1aa', // zinc-400
    },
    divider: 'rgba(255, 255, 255, 0.10)',
    action: {
      hover: 'rgba(255, 255, 255, 0.05)',
      selected: 'rgba(99, 102, 241, 0.12)',
    },
  },
  typography: {
    fontFamily: '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.03em', color: '#f4f4f5' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em', color: '#f4f4f5' },
    h3: { fontWeight: 600, letterSpacing: '-0.02em', color: '#f4f4f5' },
    h4: { fontWeight: 600, letterSpacing: '-0.02em', color: '#f4f4f5' },
    h5: { fontWeight: 600, letterSpacing: '-0.015em', color: '#f4f4f5' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em', color: '#f4f4f5' },
    subtitle1: { color: '#a1a1aa' },
    subtitle2: { color: '#a1a1aa' },
    body1: { color: '#f4f4f5' },
    body2: { color: '#a1a1aa' },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#09090b',
          color: '#f4f4f5',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(24, 24, 27, 0.65)',
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: '12px',
          color: '#f4f4f5',
        },
        outlined: {
          backgroundColor: 'rgba(24, 24, 27, 0.50)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(24, 24, 27, 0.50)',
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: '12px',
          color: '#f4f4f5',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '7px 16px',
          fontSize: '0.85rem',
          boxShadow: 'none',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.25)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
          },
        },
        containedPrimary: {
          backgroundColor: '#f4f4f5',
          color: '#09090b',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#ffffff',
            boxShadow: '0 0 20px -2px rgba(255, 255, 255, 0.25)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.15)',
          color: '#f4f4f5',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0) scale(0.98)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#18181b',
          borderRadius: '8px',
          color: '#f4f4f5',
          transition: 'all 0.2s',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.10)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.20)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e4e4e7',
            borderWidth: '1px',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#a1a1aa',
          fontSize: '0.85rem',
          '&.Mui-focused': {
            color: '#e4e4e7',
          },
        },
        outlined: {
          '&.MuiInputLabel-shrink': {
            backgroundColor: '#18181b',
            padding: '0 4px',
            borderRadius: '4px',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#18181b',
            borderRadius: '8px',
            color: '#f4f4f5',
            transition: 'all 0.2s',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.10)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.20)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#e4e4e7',
              borderWidth: '1px',
            },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          backgroundColor: '#18181b',
          borderRadius: '8px',
          color: '#f4f4f5',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.10)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.20)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e4e4e7',
            borderWidth: '1px',
          },
          '& .MuiSvgIcon-root': {
            color: '#a1a1aa',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
          fontWeight: 600,
          color: '#a1a1aa',
          fontFamily: '"JetBrains Mono", monospace',
          backgroundColor: 'rgba(9, 9, 11, 0.65)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
        },
        body: {
          color: '#f4f4f5',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '0.825rem',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: 'rgba(39, 39, 42, 0.45)',
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(24, 24, 27, 0.50)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: 'none',
          borderRadius: '8px',
          color: '#f4f4f5',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '8px 0',
            backgroundColor: 'rgba(24, 24, 27, 0.70)',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(24, 24, 27, 0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f4f4f5',
          animation: 'luminaModalEnter 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#18181b',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
          color: '#f4f4f5',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.10)',
          color: '#a1a1aa',
        },
      },
    },
    MuiSkeleton: {
      defaultProps: {
        animation: 'wave',
      },
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
          '&::after': {
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
          },
          borderRadius: '8px',
        },
      },
    },
  },
});

export default theme;
