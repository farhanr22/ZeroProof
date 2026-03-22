import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, Typography, Button, Box, Grid, Card, CardContent, AppBar, Toolbar, CssBaseline 
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import FingerprintOutlinedIcon from '@mui/icons-material/FingerprintOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';


const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10B981', // Emerald Green (Trust, Go, Verify)
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8B5CF6', // Amethyst Purple (Crypto, AI, Math)
    },
    background: {
      default: '#0B0F19', // Deep Slate Blue/Black
      paper: '#111827',   // Slightly lighter slate for cards
    },
    text: {
      primary: '#F9FAFB',
      secondary: '#9CA3AF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 900 },
    h2: { fontWeight: 800 },
    h4: { fontWeight: 700 },
  },
  shape: {
    borderRadius: 16, // Modern, softer corners
  },
});

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline /> {/* Applies the dark background globally to this view */}
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Navigation Bar */}
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <ShieldOutlinedIcon color="primary" fontSize="large" />
                <Typography variant="h6" fontWeight="bold" letterSpacing={1}>
                  SnackOverflow
                </Typography>
              </Box>
              <Box gap={3} display="flex" alignItems="center">
                {user ? (
                  <Button component={RouterLink} to="/campaigns" variant="contained" color="primary" sx={{ px: 3, py: 1, fontWeight: 'bold', textTransform: 'none' }}>
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button component={RouterLink} to="/login" sx={{ color: 'text.primary', fontWeight: 'bold', '&:hover': { color: 'primary.main' } }}>
                      Admin Login
                    </Button>
                    <Button component={RouterLink} to="/signup" variant="contained" color="primary" sx={{ px: 3, py: 1, fontWeight: 'bold', textTransform: 'none' }}>
                      Deploy Network
                    </Button>
                  </>
                )}
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Hero Section with subtle radial gradient */}
        <Box sx={{ 
          pt: 15, 
          pb: 12, 
          textAlign: 'center', 
          background: 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15) 0%, #0B0F19 60%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Container maxWidth="md">
            <ChipBadge label="V 1.0 Live Protocol" />
            <Typography variant="h2" component="h1" gutterBottom sx={{ mt: 3, background: 'linear-gradient(to right, #10B981, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Cryptographically Verifiable. <br /> Completely Anonymous.
            </Typography>
            <Typography variant="h6" sx={{ mb: 5, color: 'text.secondary', fontWeight: 400, lineHeight: 1.6 }}>
              The zero-trust feedback and telemetry protocol. Organizations secure controlled access and actionable AI insights. Respondents get mathematical proof that their identity is protected.
            </Typography>
            <Box display="flex" justifyContent="center" gap={3}>
              {user ? (
                <Button component={RouterLink} to="/campaigns" variant="contained" color="primary" size="large" sx={{ py: 1.5, px: 4, fontSize: '1.1rem', textTransform: 'none', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                  Go to Dashboard
                </Button>
              ) : (
                <Button component={RouterLink} to="/signup" variant="contained" color="primary" size="large" sx={{ py: 1.5, px: 4, fontSize: '1.1rem', textTransform: 'none', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                  Start a Campaign
                </Button>
              )}
              <Button variant="outlined" color="inherit" size="large" sx={{ py: 1.5, px: 4, fontSize: '1.1rem', textTransform: 'none', borderColor: 'rgba(255,255,255,0.2)' }}>
                Read the Specs
              </Button>
            </Box>
          </Container>
        </Box>

        {/* Value Proposition Section */}
        <Container maxWidth="lg" sx={{ py: 12 }}>
          <Typography variant="h4" textAlign="center" mb={2}>
            Solving the Enterprise Feedback Dilemma
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" mb={8} maxWidth="700px" mx="auto">
            Traditional forms force a choice between verifying who is responding, or keeping their answers anonymous. OmniGuard uses Blind RSA Signatures to guarantee both.
          </Typography>
          
          <Grid container spacing={4}>
            {/* Feature 1 */}
            <Grid item xs={12} md={4}>
              <HoverCard colorHex="#10B981">
                <KeyOutlinedIcon sx={{ fontSize: 48, color: '#10B981', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Controlled Access
                </Typography>
                <Typography color="text.secondary" lineHeight={1.6}>
                  No more public form spam. Only users authenticated with a one-time OTP can generate a voting ticket, ensuring your data pool is strictly authorized personnel.
                </Typography>
              </HoverCard>
            </Grid>

            {/* Feature 2 */}
            <Grid item xs={12} md={4}>
              <HoverCard colorHex="#8B5CF6">
                <VisibilityOffOutlinedIcon sx={{ fontSize: 48, color: '#8B5CF6', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Zero-Trust Architecture
                </Typography>
                <Typography color="text.secondary" lineHeight={1.6}>
                  Even if the server is malicious, it mathematically cannot link a user's initial registration IP or OTP to their final decrypted response submission.
                </Typography>
              </HoverCard>
            </Grid>

            {/* Feature 3 */}
            <Grid item xs={12} md={4}>
              <HoverCard colorHex="#3B82F6">
                <InsightsOutlinedIcon sx={{ fontSize: 48, color: '#3B82F6', mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  AI-Powered Insights
                </Typography>
                <Typography color="text.secondary" lineHeight={1.6}>
                  Raw data is transformed instantly. Our integrated LLM analyzes qualitative text feedback to deliver narrative summaries and organizational sentiment trends.
                </Typography>
              </HoverCard>
            </Grid>
          </Grid>
        </Container>

        {/* How It Works Section */}
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', py: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Container maxWidth="lg">
             <Typography variant="h4" textAlign="center" mb={8}>
              The Protocol Flow
            </Typography>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={4} textAlign="center">
                <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: '50%', display: 'inline-block', mb: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <FingerprintOutlinedIcon sx={{ fontSize: 40, color: '#10B981' }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>1. Token Generation</Typography>
                <Typography color="text.secondary">The client app generates a random token and mathematically "blinds" it before sending it to the server with their OTP.</Typography>
              </Grid>
              <Grid item xs={12} md={4} textAlign="center">
                <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: '50%', display: 'inline-block', mb: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <ShieldOutlinedIcon sx={{ fontSize: 40, color: '#8B5CF6' }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>2. Blind Signature</Typography>
                <Typography color="text.secondary">The server verifies the OTP and signs the hidden token. It returns the signature without ever seeing the token inside.</Typography>
              </Grid>
              <Grid item xs={12} md={4} textAlign="center">
                <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: '50%', display: 'inline-block', mb: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <LockResetOutlinedIcon sx={{ fontSize: 40, color: '#3B82F6' }} />
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>3. Anonymous Submission</Typography>
                <Typography color="text.secondary">The client unblinds the token and submits the feedback. The server verifies its own signature, but cannot link it to the user who requested it.</Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* The "How it Works for Users" callout */}
        <Container maxWidth="md" sx={{ py: 10 }}>
          <Box sx={{ p: 6, bgcolor: 'background.paper', borderRadius: 4, textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', bgcolor: '#10B981' }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
              Are you a respondent?
            </Typography>
            <Typography color="text.secondary" maxWidth="600px" mx="auto" mb={0}>
              When you enter your OTP, your device generates a unique <b>Security Pattern Image</b>. Compare this pattern with your peers—if they all match, it is mathematically guaranteed that the server is not tagging your specific device to track you.
            </Typography>
          </Box>
        </Container>

        {/* Simple Footer */}
        <Box component="footer" sx={{ py: 4, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', bgcolor: '#0B0F19' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} SnackOverflow. Built for Hackathon.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// Helper component for the little badge in the hero
function ChipBadge({ label }) {
  return (
    <Box sx={{ 
      display: 'inline-block', 
      px: 2, 
      py: 0.5, 
      borderRadius: '50px', 
      border: '1px solid rgba(139, 92, 246, 0.5)', 
      bgcolor: 'rgba(139, 92, 246, 0.1)',
      color: '#8B5CF6',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      mb: 3
    }}>
      {label}
    </Box>
  );
}

// Helper component for Cards with glowing hover effects
function HoverCard({ children, colorHex }) {
  return (
    <Card sx={{ 
      height: '100%', 
      bgcolor: 'background.paper',
      border: '1px solid rgba(255,255,255,0.05)',
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: colorHex,
        boxShadow: `0 0 20px ${colorHex}33`, // 33 is 20% opacity in hex
        transform: 'translateY(-5px)'
      }
    }}>
      <CardContent sx={{ p: 4 }}>
        {children}
      </CardContent>
    </Card>
  );
}