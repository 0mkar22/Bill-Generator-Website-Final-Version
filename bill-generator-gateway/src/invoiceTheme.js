import { createTheme } from '@mui/material/styles';

const invoiceTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#000000',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#000000',
    },
    divider: '#000000',
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    allVariants: {
      color: '#000000',
      fontFamily: 'Arial, sans-serif',
    },
    h1: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    h2: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    h3: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    h4: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    h5: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    h6: { color: '#000000', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
    body1: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    body2: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    subtitle1: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    subtitle2: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    caption: { color: '#000000', fontFamily: 'Arial, sans-serif' },
    button: { textTransform: 'none', color: '#000000' },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff !important',
          backgroundImage: 'none !important',
          backdropFilter: 'none !important',
          WebkitBackdropFilter: 'none !important',
          boxShadow: 'none !important',
          borderRadius: '0px !important',
          color: '#000000 !important',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff !important',
          borderCollapse: 'collapse !important',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff !important',
          boxShadow: 'none !important',
          borderRadius: '0px !important',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff !important',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff !important',
          '&:hover': {
            backgroundColor: '#ffffff !important',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff !important',
          color: '#000000 !important',
          borderColor: '#000000 !important',
          fontFamily: 'Arial, sans-serif !important',
          padding: '4px 8px',
        },
        head: {
          backgroundColor: '#ffffff !important',
          color: '#000000 !important',
          fontWeight: 'bold !important',
          fontFamily: 'Arial, sans-serif !important',
          textTransform: 'uppercase',
          letterSpacing: 'normal',
          borderBottom: '1px solid #000000 !important',
        },
        body: {
          backgroundColor: '#ffffff !important',
          color: '#000000 !important',
          borderBottom: '1px solid #000000 !important',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#000000 !important',
          fontFamily: 'Arial, sans-serif !important',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            color: '#000000 !important',
            fontFamily: 'Arial, sans-serif !important',
            backgroundColor: 'transparent !important',
          },
          '& .MuiInputBase-input': {
            color: '#000000 !important',
            fontFamily: 'Arial, sans-serif !important',
            padding: 0,
          },
        },
      },
    },
  },
});

export default invoiceTheme;
