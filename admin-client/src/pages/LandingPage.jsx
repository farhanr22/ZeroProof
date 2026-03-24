import React, { useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Box, Grid, Card, CardHeader, CardContent,
  AppBar, Toolbar, CssBaseline, Chip, Stack, IconButton, Stepper, Step, StepLabel, StepConnector,
  Paper, useMediaQuery
} from '@mui/material';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';

// Icons
import GitHubIcon from '@mui/icons-material/GitHub';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';
import GroupsIcon from '@mui/icons-material/Groups';
import VerifiedIcon from '@mui/icons-material/Verified';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CodeIcon from '@mui/icons-material/Code';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from '@mui/material/Link';
import logo from '../assets/logo.svg';

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
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: '"IBM Plex Mono", monospace',
          letterSpacing: '0.02em',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: `0 8px 20px -6px ${ACCENT}80`,
            transform: 'translateY(-1px)',
          }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: BG_CARD,
          borderColor: BORDER_COLOR,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease',
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
          
          ::selection {
            background: ${ACCENT}33;
            color: #0F172A;
          }

          /* Global Custom Scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: ${BG_MAIN};
          }
          ::-webkit-scrollbar-thumb {
            background: ${BORDER_COLOR};
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #cbd5e1;
          }

          /* Custom horizontal scrollbar hiding for carousel */
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;  
            scrollbar-width: none;  
          }

          .bg-dot-grid {
            background-image: radial-gradient(${BORDER_COLOR} 1.5px, transparent 1px);
            background-size: 32px 32px;
          }

          .bg-hazard-stripes {
            background: repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 20px,
              rgba(226, 232, 240, 0.5) 20px,
              rgba(226, 232, 240, 0.5) 22px
            );
          }

          .glass-nav {
            background-color: rgba(255, 255, 255, 0.7) !important;
            backdrop-filter: blur(12px) saturate(180%) !important;
            -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
          }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up {
            animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }
          .delay-1 { animation-delay: 0.1s; }
          .delay-2 { animation-delay: 0.2s; }
          .delay-3 { animation-delay: 0.3s; }
          .delay-4 { animation-delay: 0.4s; }

          @keyframes ambientFloat {
            0% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -52%) scale(1.05); }
            100% { transform: translate(-50%, -50%) scale(1); }
          }

          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 ${ACCENT}55; }
            70% { box-shadow: 0 0 0 15px ${ACCENT}00; }
            100% { box-shadow: 0 0 0 0 ${ACCENT}00; }
          }

          .hardware-lift:hover {
            transform: translate(-4px, -4px);
            box-shadow: 8px 8px 0px 0px ${BORDER_COLOR} !important;
          }

          .hover-lift:hover {
            box-shadow: 0 16px 32px -12px rgba(15, 23, 42, 0.1) !important;
          }
        `}
      </style>

      {/* --- Section 1: Navbar --- */}
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        className="glass-nav"
        sx={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 55, sm: 65 } }}>
            <Box display="flex" alignItems="center" gap={1.5} sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
              <Box component="img" src={logo} sx={{ width: 32, height: 32, transition: 'transform 0.3s ease', '&:hover': { transform: 'rotate(-10deg) scale(1.05)' } }} />
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontFamily: '"IBM Plex Mono", monospace', color: ACCENT, letterSpacing: '-0.02em' }}>
                ZeroProof
              </Typography>
            </Box>
            <Stack direction="row" sx={{ gap: { xs: 1, sm: 2 } }} alignItems="center">
              {user ? (
                <Button variant="outlined" color="primary" onClick={() => navigate('/campaigns')}>
                  Dashboard
                </Button>
              ) : (
                <Button variant="outlined" color="inherit" onClick={() => navigate('/login')} sx={{ borderColor: BORDER_COLOR, color: 'text.primary', '&:hover': { backgroundColor: BG_ALT, borderColor: 'text.primary' } }}>
                  Log In
                </Button>
              )}
              <IconButton
                component="a"
                href="https://github.com/farhanr22/ZeroProof/"
                target="_blank"
                rel="noopener"
                color="inherit"
                size="small"
                sx={{ opacity: 0.7, '&:hover': { opacity: 1, transform: 'scale(1.1)' }, transition: 'all 0.2s', color: 'text.primary' }}
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
        <Box className="bg-dot-grid" sx={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none', zIndex: 0 }} />
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
            zIndex: 0,
            animation: 'ambientFloat 8s ease-in-out infinite'
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box className="animate-fade-up delay-1">
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
                bgcolor: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
                transition: 'all 0.3s ease',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
              }} />
          </Box>

          <Typography variant="h1" className="animate-fade-up delay-2" sx={{ fontSize: { xs: '2.5rem', md: '4.5rem' }, lineHeight: 1.1, mb: 4, color: 'text.primary' }}>
            Anonymous feedback.<br />
            <Box component="span" sx={{ color: ACCENT, position: 'relative', textShadow: `0 0 32px ${ACCENT}33` }}>
              No trust required.
            </Box>
          </Typography>

          <Typography variant="body1" className="animate-fade-up delay-3" color="text.secondary" sx={{ mb: 6, maxWidth: '550px', mx: 'auto', fontSize: { xs: '1rem', md: '1.2rem' }, textAlign: 'center' }}>
            Organizations deserve honest feedback. Respondents deserve real privacy. Built with cryptography to enable both - even when the stakes are high.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ maxWidth: { xs: 260, sm: 'none' }, mx: 'auto' }}
            className="animate-fade-up delay-4"
          >
            {user ? (
              <Button variant="contained" color="primary" size="large" onClick={() => navigate('/campaigns')} sx={{ px: 4, py: 1.5, boxShadow: 'none' }}>
                Open Dashboard
              </Button>
            ) : (
              <Button variant="contained" color="primary" size="large" onClick={() => navigate('/signup')} sx={{ px: 4, py: 1.5, boxShadow: 'none' }}>
                Get Started
              </Button>
            )}

            <Stack direction="row" spacing={1.5}>
              <Button
                component="a"
                href="https://farhanr22.github.io/ZeroProof/"
                target="_blank"
                variant="outlined"
                endIcon={<OpenInNewIcon fontSize="small" />}
                sx={{
                  color: 'text.secondary',
                  px: 2,
                  py: 1.5,
                  borderColor: BORDER_COLOR,
                  flexGrow: 1,
                  '&:hover': { color: 'text.primary', borderColor: 'text.primary', bgcolor: 'transparent', transform: 'translateY(-1px)' }
                }}
              >
                Client Web App
              </Button>

              <IconButton
                variant="outlined"
                component="a" href="https://github.com/farhanr22/ZeroProof/" target="_blank"
                sx={{
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: 1,
                  color: 'text.secondary',
                  p: 1.5,
                  flexShrink: 0,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  '&:hover': { borderColor: 'text.primary', color: 'text.primary', transform: 'translateY(-1px)' }
                }}
              >
                <GitHubIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* --- Section 3: What We're Trying to Fix --- */}
      <Box id="learn-more" sx={{ py: 15, bgcolor: BG_MAIN, borderTop: `1px solid ${BORDER_COLOR}`, position: 'relative', overflow: 'hidden' }}>

        <Box className="bg-hazard-stripes" sx={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none', zIndex: 0 }} />
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(circle 800px at 50% 50%, transparent 30%, ${BG_MAIN} 100%)`, pointerEvents: 'none', zIndex: 0 }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" textAlign="center" mb={1}>
            The feedback dilemma without a proper solution.
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" mb={8}>
            Every existing solution asks you to compromise on{" "}<span style={{ fontStyle: "italic" }}>something*</span>.
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ alignItems: 'stretch' }}>

            {/* Dossier Card 1 */}
            <Card
              variant="outlined"
              sx={{
                flex: 1,
                padding: 4,
                position: 'relative',
                overflow: 'visible',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: '#F59E0B66',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': { borderColor: '#F59E0B', transform: 'translateY(-4px)' }
              }}
            >
              <Box sx={{ position: 'absolute', top: -14, left: 24, bgcolor: BG_MAIN, px: 1, border: `1px solid #F59E0B66`, borderRadius: 1 }}>
                <Typography variant="overline" color="#F59E0B" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>// VULNERABILITY_01</Typography>
              </Box>

              <CardHeader
                avatar={<ReportProblemIcon sx={{ color: '#F59E0B', fontSize: 32 }} />}
                title={<Typography variant="h6" color="#F59E0B" fontFamily='"IBM Plex Mono", monospace'>Open to Everyone</Typography>}
                sx={{ pb: 0, px: 0, pt: 1 }}
              />
              <CardContent sx={{ px: 0, pb: 0, "&:last-child": { pb: 0 } }}>
                <Typography variant="body1" color="text.secondary">
                  A public form with no login sounds private — but it's open to spam, manipulation, and coordinated abuse. There's nothing stopping someone from submitting fifty times and altering the consensus.
                </Typography>
              </CardContent>
            </Card>

            {/* Dossier Card 2 */}
            <Card
              variant="outlined"
              sx={{
                flex: 1,
                padding: 4,
                position: 'relative',
                overflow: 'visible',
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: '#EF444466',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                '&:hover': { borderColor: '#EF4444', transform: 'translateY(-4px)' }
              }}
            >
              <Box sx={{ position: 'absolute', top: -14, left: 24, bgcolor: BG_MAIN, px: 1, border: `1px solid #EF444466`, borderRadius: 1 }}>
                <Typography variant="overline" color="#EF4444" fontWeight="bold" sx={{ fontSize: '0.75rem' }}>// VULNERABILITY_02</Typography>
              </Box>

              <CardHeader
                avatar={<LockPersonIcon sx={{ color: '#EF4444', fontSize: 32 }} />}
                title={<Typography variant="h6" color="#EF4444" fontFamily='"IBM Plex Mono", monospace'>Trust Someone</Typography>}
                sx={{ pb: 0, px: 0, pt: 1 }}
              />
              <CardContent sx={{ px: 0, pb: 0, "&:last-child": { pb: 0 } }}>
                <Typography variant="body1" color="text.secondary">
                  Whether it's a Google Form with login required or a third-party whistleblower platform — someone, somewhere can link your identity to your response. You're not anonymous. You're just hoping the server operator is honest.
                </Typography>
              </CardContent>
            </Card>

          </Stack>

          <Typography variant="body2" textAlign="center" color="text.secondary" mt={6} sx={{ fontStyle: 'italic', maxWidth: '550px', mx: 'auto' }} >
            * Both approaches require a leap of faith — whether organizations looking for legitimate feedback, or respondents expecting privacy.
          </Typography>
        </Container>
      </Box>

      {/* --- Section 4: Our Solution (The Flow) --- */}
      <Box sx={{ py: 12, bgcolor: BG_ALT, borderTop: `1px solid ${BORDER_COLOR}`, borderBottom: `1px solid ${BORDER_COLOR}`, position: 'relative' }}>
        <Box className="bg-dot-grid" sx={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none', zIndex: 0 }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" textAlign="center" mb={8}>
            Our solution — from both angles.
          </Typography>

          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            <Stepper orientation="vertical" nonLinear connector={
              <StepConnector sx={{
                '& .MuiStepConnector-line': { borderLeft: `2px dashed ${BORDER_COLOR}`, minHeight: 24 },
                ml: 1.5,
              }} />
            }>
              {/* Step 1 */}
              <Step expanded active={false}>
                <StepLabel icon={<AdminPanelSettingsIcon sx={{ color: 'text.secondary' }} />}>
                  <Typography variant="h6" color="text.primary">Admin enters contact details</Typography>
                </StepLabel>
                <Box sx={{ pl: 4, pr: 2, pb: 0, pt: 1, borderLeft: `2px dashed ${BORDER_COLOR}`, ml: 1.5, transition: 'border-color 0.3s', '&:hover': { borderLeftColor: ACCENT } }}>
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
                <Box sx={{ pl: 4, pr: 2, pb: 0, pt: 1, borderLeft: `2px dashed ${BORDER_COLOR}`, ml: 1.5, transition: 'border-color 0.3s', '&:hover': { borderLeftColor: ACCENT } }}>
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
                <Box sx={{ pl: 4, pr: 2, pb: 0, pt: 1, borderLeft: `2px dashed ${BORDER_COLOR}`, ml: 1.5, transition: 'border-color 0.3s', '&:hover': { borderLeftColor: ACCENT } }}>
                  <Typography variant="body1" color="text.secondary">
                    Respondents use an open-source client for performing their side of the process transparently.
                  </Typography>
                </Box>
              </Step>

              {/* Step 4 */}
              <Step expanded active={false}>
                <StepLabel icon={<GroupsIcon sx={{ color: 'text.secondary' }} />}>
                  <Typography variant="h6" color="text.primary">Verify the Security Pattern with your group</Typography>
                </StepLabel>
                <Box sx={{ pl: 4, pr: 2, pb: 0, pt: 1, borderLeft: `2px dashed ${BORDER_COLOR}`, ml: 1.5, transition: 'border-color 0.3s', '&:hover': { borderLeftColor: ACCENT } }}>
                  <Typography variant="body1" color="text.secondary">
                    The client app generates a visual fingerprint of the campaign. If everyone in the group sees the same pattern, the server hasn't tampered with the setup.
                  </Typography>
                </Box>
              </Step>

              {/* Step 5 - Highlighted Payoff */}
              <Step expanded active={false} completed={false}>
                <StepLabel
                  icon={
                    <Box sx={{ position: 'relative', display: 'flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ position: 'absolute', inset: 0, bgcolor: ACCENT, borderRadius: '50%', animation: 'pulseGlow 2.5s infinite' }} />
                      <VerifiedIcon sx={{ color: ACCENT, position: 'relative', zIndex: 1, bgcolor: BG_MAIN, borderRadius: '50%', fontSize: 24 }} />
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
      <Box sx={{ pt: 12, pb: 14, bgcolor: BG_MAIN }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={6} px={{ xs: 2, md: 6 }}>
            <Typography variant="h4">
              Where this matters.
            </Typography>
            {/* Desktop scroll controls */}
            <Box display={{ xs: 'none', md: 'flex' }} gap={1}>
              <IconButton variant="outlined" onClick={() => scrollCarousel('left')} sx={{ border: `1px solid ${BORDER_COLOR}`, color: 'text.primary', '&:hover': { bgcolor: BG_ALT } }}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton variant="outlined" onClick={() => scrollCarousel('right')} sx={{ border: `1px solid ${BORDER_COLOR}`, color: 'text.primary', '&:hover': { bgcolor: BG_ALT } }}>
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

              {[
                { overline: 'Workplace', title: 'Employee Feedback', desc: 'Teams can share honest feedback about management, culture, or processes without fear of being identified — even by a compromised HR system.' },
                { overline: 'Safety', title: 'Harrasment Reporting', desc: 'Empower employees to report workplace harassment or misconduct with guaranteed anonymity, completely removing the fear of retaliation.' },
                { overline: 'Education', title: 'Student Evaluations', desc: 'Students rate instructors or flag issues in course delivery, knowing the institution cannot link responses to names.' },
                { overline: 'Community', title: 'Resident Surveys', desc: 'Local governments or housing boards collect genuine community sentiment without residents worrying about being singled out.' },
                { overline: 'Governance', title: 'Board & Committee Voting', desc: 'Confidential structured feedback among a known, controlled group — with cryptographic proof that only members participated.' },
              ].map((item, i) => (
                <Card key={i} className="hover-lift" variant="outlined" sx={{ minWidth: 320, maxWidth: 320, flexShrink: 0 }}>
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="overline" color="primary.main" mb={1}>{item.overline}</Typography>
                    <Typography variant="h6" mb={2} color="text.primary">{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </CardContent>
                </Card>
              ))}

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

            {[
              {
                icon: <VpnKeyIcon sx={{ color: 'text.secondary' }} />,
                title: 'One-time OTP + Blind Signature',
                desc: <>When a respondent uses their one-time code to get a "voting ticket", the client app sends a unique token to the server — but in a <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>blinded</Box> form. The server signs this token
                  using a <Link
                    href="https://en.wikipedia.org/wiki/Blind_signature"
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                  >
                    Blind Signature
                  </Link> protocol.</>
              },
              {
                icon: <VisibilityOffIcon sx={{ color: 'text.secondary' }} />,
                title: 'Unlinkable Response',
                desc: 'The client app attaches the original token and signature along with the response. Because the token was blinded during signing, the registration event (OTP use) and the submission event (response) are cryptographically isolated and unlinkable.'
              },
              {
                icon: <CodeIcon sx={{ color: 'text.secondary' }} />,
                title: 'Open Source Client for Trust',
                desc: 'The client app that performs the blinding and unblinding is fully open source. Respondents can audit the protocol implementation and the data being sent to the server. There is no hidden data collection.'
              },
              {
                icon: <FingerprintIcon sx={{ color: 'text.secondary' }} />,
                title: 'Security Pattern for Verification',
                desc: "The client generates a visual fingerprint from the campaign's public key. If a malicious server tries to target a specific respondent, their Security Pattern would not match their peers — a clear tamper signal."
              }
            ].map((feature, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                {/* Combined hover effects: Draft 1 border transform + Draft 2 boxy lift */}
                <Paper
                  className="hardware-lift"
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 0,
                    borderTop: `1px solid ${BORDER_COLOR}`,
                    borderRight: `1px solid ${BORDER_COLOR}`,
                    borderBottom: `1px solid ${BORDER_COLOR}`,
                    borderLeft: `4px solid ${ACCENT}`,
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    backgroundColor: BG_CARD,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: BG_MAIN,
                      borderColor: `${ACCENT}80`,
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box sx={{
                      display: 'flex',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: `${ACCENT}08`,
                      transition: 'background-color 0.3s',
                      '.hardware-lift:hover &': { bgcolor: `${ACCENT}15` }
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" color="text.primary">{feature.title}</Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" sx={{ pl: 7 }}>
                    {feature.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}

          </Grid>
        </Container>
      </Box>

      {/* --- Footer --- */}
      <Box component="footer" sx={{ py: 6, bgcolor: BG_MAIN, borderTop: `1px solid ${BORDER_COLOR}`, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="body2" color="text.secondary" mb={1} sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
            Zero-Trust Anonymous Feedback &middot; Open Source &middot; No warranty implied
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Built by Team SnackOverflow @ <a href="https://binaryvtwo.devfolio.co" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: '4px' }}>Binary V2</a>.
          </Typography>
          <IconButton
            component="a"
            href="https://github.com/farhanr22/ZeroProof/"
            target="_blank"
            rel="noopener"
            color="inherit"
            size="small"
            sx={{ opacity: 0.5, '&:hover': { opacity: 1, transform: 'scale(1.1)' }, transition: 'all 0.2s', color: 'text.primary' }}
          >
            <GitHubIcon fontSize="small" />
          </IconButton>
        </Container>
      </Box>

    </ThemeProvider>
  );
}