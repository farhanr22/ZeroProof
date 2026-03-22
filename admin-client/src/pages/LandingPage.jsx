import React, { useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Box, Grid, Card, CardHeader, CardContent,
  AppBar, Toolbar, CssBaseline, Chip, Stack, IconButton, Stepper, Step, StepLabel,
  Paper, useMediaQuery
} from '@mui/material';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';

// Icons
import GitHubIcon from '@mui/icons-material/GitHub';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';
import GroupsIcon from '@mui/icons-material/Groups';
import VerifiedIcon from '@mui/icons-material/Verified';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CodeIcon from '@mui/icons-material/Code';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useAuth } from '../hooks/useAuth.jsx';

// Accent Colors
const ACCENT = '#3B82F6'; // Corporate Blue from existing theme
const BG_MAIN = '#ffffff'; // White background
const BG_ALT = '#F8FAFC';  // Slightly grey alternating section
const BG_CARD = '#ffffff'; // Card backgrounds

const BORDER_COLOR = '#E2E8F0';

const landingTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: ACCENT,
    },
    background: {
      default: BG_MAIN,
      paper: BG_CARD,
    },
    text: {
      primary: '#0F172A', // Dark slate for primary text
      secondary: '#64748B', // Muted slate for secondary text
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", sans-serif',
    h1: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, letterSpacing: '-0.05em' },
    h2: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, letterSpacing: '-0.03em' },
    h4: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, letterSpacing: '-0.02em', color: '#0F172A' },
    h6: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 },
    overline: { fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, letterSpacing: '0.1em' },
    body1: { fontSize: '1.1rem', lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
  },
  shape: {
    borderRadius: 8, // Thinner, techy feel
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: '"IBM Plex Mono", monospace',
          letterSpacing: '0.02em',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: BG_CARD,
          borderColor: BORDER_COLOR,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        }
      }
    }
  },
});

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Custom scroll for "Learn More"
  const scrollToLearnMore = () => {
    document.getElementById('learn-more')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carousel ref for Section 5
  const carouselRef = React.useRef(null);
  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      const scrollAmount = dir === 'left' ? -350 : 350;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <ThemeProvider theme={landingTheme}>
      <CssBaseline />
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700&display=swap');
          
          /* Custom horizontal scrollbar hiding */
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}
      </style>

      {/* --- Section 1: Navbar --- */}
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${BORDER_COLOR}`,
          backgroundColor: 'rgba(255, 255, 255, 0.8)'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: '64px' }}>
            <Typography variant="h6" sx={{ color: ACCENT, fontWeight: 'bold' }}>
              SnackOverflow
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {user ? (
                <Button variant="outlined" color="primary" onClick={() => navigate('/campaigns')}>
                  Go to Dashboard
                </Button>
              ) : (
                <Button variant="outlined" color="inherit" onClick={() => navigate('/login')} sx={{ borderColor: BORDER_COLOR, color: 'text.primary' }}>
                  Log In
                </Button>
              )}
              <IconButton
                component="a"
                href="https://github.com"
                target="_blank"
                rel="noopener"
                color="inherit"
                size="small"
                sx={{ opacity: 0.7, '&:hover': { opacity: 1 }, color: 'text.primary' }}
              >
                <GitHubIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* --- Section 2: Hero --- */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: BG_MAIN
        }}
      >
        {/* Subtle radial gradient bloom */}
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '800px',
            background: `radial-gradient(circle, ${ACCENT}15 0%, transparent 60%)`,
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Chip
            label="Open Protocol · Open Source"
            variant="outlined"
            sx={{
              color: ACCENT,
              borderColor: `${ACCENT}55`,
              mb: 4,
              fontFamily: '"IBM Plex Mono", monospace',
              fontWeight: 600,
              letterSpacing: '0.05em',
              bgcolor: `${ACCENT}08`
            }}
          />

          <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.1, mb: 3, color: 'text.primary' }}>
            Anonymous feedback.<br />
            <Box component="span" sx={{ color: ACCENT }}>No trust required.</Box>
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: '550px', mx: 'auto' }}>
            Organizations deserve honest input. Respondents deserve real privacy.
            A cryptographic protocol that guarantees both — no compromises when the stakes are high.
          </Typography>

          <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
            {user ? (
              <Button variant="contained" color="primary" size="large" onClick={() => navigate('/campaigns')} sx={{ px: 4, py: 1.5, boxShadow: 'none' }}>
                Enter Dashboard
              </Button>
            ) : (
              <Button variant="contained" color="primary" size="large" onClick={() => navigate('/signup')} sx={{ px: 4, py: 1.5, boxShadow: 'none' }}>
                Get Started
              </Button>
            )}

            <Button
              variant="text"
              sx={{ color: 'text.secondary', px: 3, py: 1.5, '&:hover': { color: 'text.primary', bgcolor: 'transparent' } }}
              endIcon={<KeyboardArrowDownIcon />}
              onClick={scrollToLearnMore}
            >
              Learn More
            </Button>

            <IconButton
              variant="outlined"
              component="a" href="https://github.com" target="_blank"
              sx={{
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: 1,
                color: 'text.secondary',
                p: 1.5,
                '&:hover': { borderColor: 'text.primary', color: 'text.primary' }
              }}
            >
              <GitHubIcon />
            </IconButton>
          </Stack>
        </Container>
      </Box>

      {/* --- Section 3: What We're Trying to Fix --- */}
      <Box id="learn-more" sx={{ py: 15, bgcolor: BG_MAIN, borderTop: `1px solid ${BORDER_COLOR}` }}>
        <Container maxWidth="lg">
          <Typography variant="h4" textAlign="center" mb={1}>
            The feedback dilemma that needs a proper solution.
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" mb={8} sx={{ fontStyle: 'italic' }}>
            Every existing solution asks you to compromise on something .
          </Typography>

          {/* Changed to Stack to guarantee side-by-side equal height flex distribution on md+ screens */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ alignItems: 'stretch' }}>
            <Card variant="outlined" sx={{ flex: 1, borderColor: BORDER_COLOR }}>
              <CardHeader
                avatar={<ReportProblemIcon sx={{ color: '#F59E0B', fontSize: 32 }} />}
                title={<Typography variant="h6" color="#F59E0B">Open to Everyone</Typography>}
                sx={{ pb: 0 }}
              />
              <CardContent>
                <Typography variant="body1" color="text.secondary">
                  A public form with no login sounds private — but it's open to spam, manipulation, and coordinated abuse. There's nothing stopping someone from submitting fifty times and altering the consensus.
                </Typography>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ flex: 1, borderColor: BORDER_COLOR }}>
              <CardHeader
                avatar={<LockPersonIcon sx={{ color: '#EF4444', fontSize: 32 }} />}
                title={<Typography variant="h6" color="#EF4444">Requires Trusting Someone</Typography>}
                sx={{ pb: 0 }}
              />
              <CardContent>
                <Typography variant="body1" color="text.secondary">
                  Whether it's a Google Form with login required or a third-party whistleblower platform — someone, somewhere can link your identity to your response. You're not anonymous. You're just hoping the server operator is honest.
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          <Typography variant="body2" textAlign="center" color="text.secondary" mt={4} sx={{ fontStyle: 'italic', maxWidth: '550px', mx: 'auto' }} >
            * Both approaches require a leap of faith — whether organizations looking for legitimate feedback, or respondents expecting privacy.
          </Typography>
        </Container>
      </Box>

      {/* --- Section 4: Our Solution (The Flow) --- */}
      <Box sx={{ py: 15, bgcolor: BG_ALT, borderTop: `1px solid ${BORDER_COLOR}`, borderBottom: `1px solid ${BORDER_COLOR}` }}>
        <Container maxWidth="md">
          <Typography variant="h4" textAlign="center" mb={8}>
            How it works — from both sides.
          </Typography>

          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            <Stepper orientation="vertical" nonLinear>
              {/* Step 1 */}
              <Step expanded active={false}>
                <StepLabel icon={<AdminPanelSettingsIcon sx={{ color: 'text.secondary' }} />}>
                  <Typography variant="h6" color="text.primary">Admin enters contact details</Typography>
                </StepLabel>
                <Box sx={{ pl: 4, pr: 2, pb: 0, pt: 1, borderLeft: `1px solid ${BORDER_COLOR}`, ml: 1.5 }}>
                  <Typography variant="body1" color="text.secondary">
                    The organization uploads a list of phone numbers or email addresses. No accounts needed for respondents.
                  </Typography>
                </Box>
              </Step>

              {/* Step 2 */}
              <Step expanded active={false}>
                <StepLabel icon={<ForwardToInboxIcon sx={{ color: 'text.secondary' }} />}>
                  <Typography variant="h6" color="text.primary">Respondents receive a one-time URL</Typography>
                </StepLabel>
                <Box sx={{ pl: 4, pr: 2, pb: 0, pt: 1, borderLeft: `1px solid ${BORDER_COLOR}`, ml: 1.5 }}>
                  <Typography variant="body1" color="text.secondary">
                    Each contact gets a unique link with a single-use code. It expires after use.
                  </Typography>
                </Box>
              </Step>

              {/* Step 3 */}
              <Step expanded active={false}>
                <StepLabel icon={<OpenInBrowserIcon sx={{ color: 'text.secondary' }} />}>
                  <Typography variant="h6" color="text.primary">Paste into the open-source client app</Typography>
                </StepLabel>
                <Box sx={{ pl: 4, pr: 2, pb: 0, pt: 1, borderLeft: `1px solid ${BORDER_COLOR}`, ml: 1.5 }}>
                  <Typography variant="body1" color="text.secondary">
                    Respondents use the open-source client — a web app they can inspect themselves. No app store, no accounts.
                  </Typography>
                </Box>
              </Step>

              {/* Step 4 */}
              <Step expanded active={false}>
                <StepLabel icon={<GroupsIcon sx={{ color: 'text.secondary' }} />}>
                  <Typography variant="h6" color="text.primary">Verify the Security Pattern with your group</Typography>
                </StepLabel>
                <Box sx={{ pl: 4, pr: 2, pb: 0, pt: 1, borderLeft: `1px solid ${BORDER_COLOR}`, ml: 1.5 }}>
                  <Typography variant="body1" color="text.secondary">
                    The client app generates a visual fingerprint of the campaign. If everyone in the group sees the same pattern, the server hasn't tampered with the setup.
                  </Typography>
                </Box>
              </Step>

              {/* Step 5 - Highlighted Payoff */}
              <Step expanded active={false} completed={false}>
                <StepLabel
                  icon={
                    <Box sx={{ position: 'relative' }}>
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: ACCENT, filter: 'blur(8px)', opacity: 0.2, borderRadius: '50%' }} />
                      <VerifiedIcon sx={{ color: ACCENT, position: 'relative', zIndex: 1 }} />
                    </Box>
                  }
                >
                  <Typography variant="h6" sx={{ color: ACCENT }}>Respond anonymously</Typography>
                </StepLabel>
                <Box sx={{ pl: 4, pr: 2, pb: 2, pt: 1, ml: 1.5 }}>
                  <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    Submit your response. The server can verify it came from an authorized respondent — but it cannot link it to you.
                  </Typography>
                </Box>
              </Step>
            </Stepper>
          </Box>
        </Container>
      </Box>

      {/* --- Section 5: Use Cases --- */}
      <Box sx={{ py: 15, bgcolor: BG_MAIN }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={6} px={{ xs: 2, md: 6 }}>
            <Typography variant="h4">
              Where this matters.
            </Typography>
            {/* Desktop scroll controls */}
            <Box display={{ xs: 'none', md: 'flex' }} gap={1}>
              <IconButton variant="outlined" onClick={() => scrollCarousel('left')} sx={{ border: `1px solid ${BORDER_COLOR}`, color: 'text.primary' }}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton variant="outlined" onClick={() => scrollCarousel('right')} sx={{ border: `1px solid ${BORDER_COLOR}`, color: 'text.primary' }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>

          <Box
            ref={carouselRef}
            className="hide-scrollbar"
            sx={{
              display: 'flex',
              overflowX: 'auto',
              px: { xs: 2, md: 6 },
              pb: 4,
            }}
          >
            <Stack direction="row" spacing={3} sx={{ pb: 1 }}>

              <Card variant="outlined" sx={{ minWidth: 320, maxWidth: 320, flexShrink: 0, borderColor: BORDER_COLOR }}>
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="overline" color="primary.main" mb={1}>Workplace</Typography>
                  <Typography variant="h6" mb={2} color="text.primary">Employee Feedback</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Teams can share honest feedback about management, culture, or processes without fear of being identified — even by a compromised HR system.
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ minWidth: 320, maxWidth: 320, flexShrink: 0, borderColor: BORDER_COLOR }}>
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="overline" color="primary.main" mb={1}>Safety</Typography>
                  <Typography variant="h6" mb={2} color="text.primary">Harrasment Reporting</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Empower employees to report workplace harassment or misconduct with guaranteed anonymity, completely removing the fear of retaliation.
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ minWidth: 320, maxWidth: 320, flexShrink: 0, borderColor: BORDER_COLOR }}>
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="overline" color="primary.main" mb={1}>Education</Typography>
                  <Typography variant="h6" mb={2} color="text.primary">Student Evaluations</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students rate instructors or flag issues in course delivery, knowing the institution cannot link responses to names.
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ minWidth: 320, maxWidth: 320, flexShrink: 0, borderColor: BORDER_COLOR }}>
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="overline" color="primary.main" mb={1}>Community</Typography>
                  <Typography variant="h6" mb={2} color="text.primary">Resident Surveys</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Local governments or housing boards collect genuine community sentiment without residents worrying about being singled out.
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ minWidth: 320, maxWidth: 320, flexShrink: 0, borderColor: BORDER_COLOR }}>
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="overline" color="primary.main" mb={1}>Governance</Typography>
                  <Typography variant="h6" mb={2} color="text.primary">Board & Committee Voting</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Confidential structured feedback among a known, controlled group — with cryptographic proof that only members participated.
                  </Typography>
                </CardContent>
              </Card>

            </Stack>
          </Box>
        </Container>
      </Box>

      {/* --- Section 6: How It's Done --- */}
      <Box sx={{ py: 15, bgcolor: BG_ALT, borderTop: `1px solid ${BORDER_COLOR}` }}>
        <Container maxWidth="lg">
          <Typography variant="h4" textAlign="center" mb={1}>
            The protocol, briefly.
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" mb={8} sx={{ fontStyle: 'italic' }}>
            For those who want to understand what's actually happening under the hood.
          </Typography>

          <Grid container spacing={3}>

            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 4, height: '100%', borderRadius: 0, borderLeft: `4px solid ${ACCENT}`, borderTop: `1px solid ${BORDER_COLOR}`, borderRight: `1px solid ${BORDER_COLOR}`, borderBottom: `1px solid ${BORDER_COLOR}` }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <VpnKeyIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h6" color="text.primary">One-time OTP + Blind Signature</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ pl: 5 }}>
                  When a respondent uses their one-time code, the server signs a cryptographic token — but in a <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>blinded</Box> form. The server cannot see what it's signing. This is RSA Blind Signatures: the server authorizes the token without learning its value.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 4, height: '100%', borderRadius: 0, borderLeft: `4px solid ${ACCENT}`, borderTop: `1px solid ${BORDER_COLOR}`, borderRight: `1px solid ${BORDER_COLOR}`, borderBottom: `1px solid ${BORDER_COLOR}` }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <VisibilityOffIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h6" color="text.primary">Unlinkable Registration</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ pl: 5 }}>
                  Because the token was blinded during signing, the server has no way to link the registration event (OTP use) to the submission event (response sent). Two separate interactions, cryptographically decoupled.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 4, height: '100%', borderRadius: 0, borderLeft: `4px solid ${ACCENT}`, borderTop: `1px solid ${BORDER_COLOR}`, borderRight: `1px solid ${BORDER_COLOR}`, borderBottom: `1px solid ${BORDER_COLOR}` }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <CodeIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h6" color="text.primary">Open Source Client for Trust</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ pl: 5 }}>
                  The client app that performs the blinding and unblinding is fully open source. Respondents can inspect exactly what is sent to the server. There is no hidden data collection.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 4, height: '100%', borderRadius: 0, borderLeft: `4px solid ${ACCENT}`, borderTop: `1px solid ${BORDER_COLOR}`, borderRight: `1px solid ${BORDER_COLOR}`, borderBottom: `1px solid ${BORDER_COLOR}` }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <FingerprintIcon sx={{ color: 'text.secondary' }} />
                  <Typography variant="h6" color="text.primary">Security Pattern for Verification</Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ pl: 5 }}>
                  The client generates a visual fingerprint from the campaign's public key and question payload. If the server tried to target a specific respondent with a different key, their pattern would not match their peers — a tamper signal anyone in the group can spot.
                </Typography>
              </Paper>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* --- Footer --- */}
      <Box component="footer" sx={{ py: 6, bgcolor: BG_MAIN, borderTop: `1px solid ${BORDER_COLOR}`, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary" mb={1}>
            Zero-Trust Anonymous Feedback &middot; Open Source &middot; No warranty implied
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Build by Team SnackOverflow @ Binary V2.
          </Typography>
          <IconButton
            component="a"
            href="https://github.com"
            target="_blank"
            rel="noopener"
            color="inherit"
            size="small"
            sx={{ opacity: 0.5, '&:hover': { opacity: 1 }, color: 'text.primary' }}
          >
            <GitHubIcon fontSize="small" />
          </IconButton>
        </Container>
      </Box>

    </ThemeProvider>
  );
}