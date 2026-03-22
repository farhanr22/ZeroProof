import { createTheme } from '@mui/material/styles';

export const globalTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#FFFFFF', // white background
      paper: '#fcfcfcff',   // light slate for cards/surfaces
    },
    primary: {
      main: '#0F172A', //Dark Slate/Blue (Primary Text & Buttons)
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2563EB', // Vibrant Blue for highlights and links
      contrastText: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    fontSize: 16,
    body1: {
      fontSize: '1.15rem', // Slightly larger and easier to read
    },
    body2: {
      fontSize: '0.95rem',
    },
    
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em', // Tightens headings slightly for a premium feel
      fontSize: '1.75rem',
      '@media (min-width:600px)': {
        fontSize: '2.25rem', // Gets bigger on desktop/tablets
      },
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
      fontSize: '1.35rem',
    },
    
    button: {
      textTransform: 'none', // non-capitalized buttons
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 8, // Crisp, slightly rounded edges
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
  },
});