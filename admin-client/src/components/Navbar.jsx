import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, Box, Container, 
  useTheme, useMediaQuery, IconButton, Drawer, List, 
  ListItem, ListItemButton, ListItemText, Divider 
} from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../hooks/useAuth.jsx'; 
import { campaignsAPI } from '../api/Client.js';

export default function Navbar() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // Determine campaign context from URL path
  const pathParts = location.pathname.split('/');
  const isInsideCampaign = pathParts[1] === 'campaigns' && pathParts[2];
  const campaignId = isInsideCampaign ? pathParts[2] : null;
  
  // Fetch and cache campaign mode
  const [campaignMode, setCampaignMode] = useState(null);

  useEffect(() => {
    if (!user || !campaignId) {
      setCampaignMode(null);
      return;
    }

    // Check localStorage cache first
    const cacheKey = `campaign_mode_${campaignId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) setCampaignMode(cached);

    // Always fetch fresh from API and update cache
    campaignsAPI.get(campaignId)
      .then(data => {
        const mode = data.campaign.mode;
        setCampaignMode(mode);
        localStorage.setItem(cacheKey, mode);
      })
      .catch(() => {
        // If fetch fails, keep cached value
      });
  }, [user, campaignId, location.pathname]);

  const navLinkStyle = {
    color: 'text.secondary',
    fontWeight: '600',
    transition: 'all 0.2s ease-in-out',
    '&:hover': { color: 'secondary.main', backgroundColor: 'transparent', transform: 'translateY(-2px)' }
  };

  const renderNavLinks = (isMobileView = false) => {
    if (user) {
      return (
        <>
          {isInsideCampaign && campaignMode ? (
            <>
              <NavItem to={`/campaigns/${campaignId}`} label="Overview" isMobile={isMobileView} />
              {campaignMode === 'draft' ? (
                <>
                  <NavItem to={`/campaigns/${campaignId}/contacts`} label="Contacts" isMobile={isMobileView} />
                  <NavItem to={`/campaigns/${campaignId}/questions`} label="Questions" isMobile={isMobileView} />
                </>
              ) : (
                <>
                  <NavItem to={`/campaigns/${campaignId}/responses`} label="Responses" isMobile={isMobileView} />
                  <NavItem to={`/campaigns/${campaignId}/insights`} label="Insights" isMobile={isMobileView} />
                </>
              )}
            </>
          ) : (
            <NavItem to="/campaigns" label="All Campaigns" isMobile={isMobileView} />
          )}
          <NavItem to="/settings" label="Settings" isMobile={isMobileView} />
        </>
      );
    }
    return null;
  };

  const NavItem = ({ to, label, isMobile: isMobileNav }) => {
    if (isMobileNav) {
      return (
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to={to} onClick={handleDrawerToggle} sx={{ py: 2 }}>
            <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 600, color: 'text.primary' }} />
          </ListItemButton>
        </ListItem>
      );
    }
    return <Button component={RouterLink} to={to} sx={navLinkStyle}>{label}</Button>;
  };

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #E2E8F0', backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', zIndex: theme.zIndex.appBar }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 64, sm: 72 } }}>
          
          <Box component={RouterLink} to={user ? "/campaigns" : "/"} sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: 'primary.main', transition: 'all 0.2s', '&:hover': { opacity: 0.8 } }}>
            <ShieldOutlinedIcon color="secondary" fontSize="large" />
            <Typography variant="h6" fontWeight="bold" letterSpacing={-0.5} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              SnackOverflow
            </Typography>
          </Box>

          {!isMobile && (
            <Box display="flex" gap={3} alignItems="center">
              {renderNavLinks()}
              {user ? (
                <Button onClick={logout} variant="outlined" color="error" sx={{ ml: 2, borderWidth: 2, '&:hover': { borderWidth: 2, backgroundColor: 'error.main', color: 'white' } }}>
                  Log Out
                </Button>
              ) : (
                !isAuthPage && (
                  <Box gap={2} display="flex">
                    <Button component={RouterLink} to="/login" sx={{ color: 'text.primary', fontWeight: 'bold' }}>Log In</Button>
                    <Button component={RouterLink} to="/signup" variant="contained" color="primary">Get Started</Button>
                  </Box>
                )
              )}
            </Box>
          )}

          {isMobile && !isAuthPage && (
            <Box display="flex" alignItems="center" gap={1}>
              {!user && (
                <Button component={RouterLink} to="/signup" variant="contained" color="primary" size="small">
                  Get Started
                </Button>
              )}
              <IconButton color="inherit" edge="end" onClick={handleDrawerToggle} sx={{ ml: 1, bgcolor: '#F1F5F9', borderRadius: 2 }}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </Container>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        PaperProps={{ sx: { width: 280, p: 2, bgcolor: '#FFFFFF' } }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <IconButton onClick={handleDrawerToggle}><CloseIcon /></IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <List sx={{ pt: 0 }}>
          {user ? (
            <>
              {renderNavLinks(true)}
              <Divider sx={{ my: 2 }} />
              <ListItem disablePadding>
                <ListItemButton onClick={() => { logout(); handleDrawerToggle(); }} sx={{ py: 2 }}>
                  <ListItemText primary="Log Out" primaryTypographyProps={{ fontWeight: 600, color: 'error.main' }} />
                </ListItemButton>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem disablePadding>
                <ListItemButton component={RouterLink} to="/login" onClick={handleDrawerToggle} sx={{ py: 2 }}>
                  <ListItemText primary="Log In" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
    </AppBar>
  );
}