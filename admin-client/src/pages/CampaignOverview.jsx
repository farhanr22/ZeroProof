import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Paper, Box, Divider, Skeleton, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { campaignsAPI } from '../api/Client.js';

export default function CampaignOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // 'activate' or 'delete'
  const [otpServiceEnabled, setOtpServiceEnabled] = useState(true);

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await campaignsAPI.get(id);
      setCampaign(data.campaign);
      if (data.config) setOtpServiceEnabled(data.config.otp_service_enabled);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);
    setError(null);
    try {
      const data = await campaignsAPI.activate(id);
      setCampaign(data.campaign);
      // Notify global components (like Navbar) to refresh status
      window.dispatchEvent(new CustomEvent('campaignUpdate'));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsActivating(false);
      setConfirmOpen(false);
    }
  };

  const handleDelete = async () => {
    try {
      await campaignsAPI.delete(id);
      navigate('/campaigns');
    } catch (err) {
      setError(err.message);
      setConfirmOpen(false);
    }
  };

  const openConfirm = (type) => {
    setConfirmType(type);
    setConfirmOpen(true);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Skeleton variant="text" width={180} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={250} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (!campaign) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Campaign not found.'}</Alert>
        <Button component={Link} to="/campaigns" startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Campaigns
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button component={Link} to="/campaigns" startIcon={<ArrowBackIcon />} sx={{ mb: 2, color: 'text.secondary' }}>
        Back to Campaigns
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}


      {/* Header section */}
      <Box mb={4} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Typography variant="h4" fontWeight="bold">{campaign.name}</Typography>
            {/* Status Pill Indicator */}
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              px: 1.5, py: 0.5, borderRadius: 1.5,
              bgcolor: campaign.mode === 'active' ? 'rgba(16, 185, 129, 0.1)' : '#F1F5F9',
              border: '1px solid', borderColor: campaign.mode === 'active' ? '#10B981' : '#E2E8F0'
            }}>
              <Box sx={{
                width: 8, height: 8, borderRadius: '50%',
                bgcolor: campaign.mode === 'active' ? '#10B981' : '#9CA3AF',
                boxShadow: campaign.mode === 'active' ? '0 0 8px rgba(16, 185, 129, 0.8)' : 'none'
              }} />
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: campaign.mode === 'active' ? '#10B981' : '#64748B', letterSpacing: 1 }}>
                {campaign.mode.toUpperCase()}
              </Typography>
            </Box>
          </Box>
          {campaign.description && (
            <Typography variant="body1" color="text.secondary">
              {campaign.description}
            </Typography>
          )}
        </Box>

        <Box display="flex" gap={1}>
          {campaign.mode === 'draft' && (
            <Button
              variant="contained" color="success" size="large" sx={{ fontWeight: 'bold' }}
              startIcon={isActivating ? <CircularProgress size={18} color="inherit" /> : <WarningAmberIcon />}
              onClick={() => openConfirm('activate')}
              disabled={isActivating}
            >
              Activate Campaign
            </Button>
          )}
          <Button
            variant="outlined" color="error" size="large"
            onClick={() => openConfirm('delete')}
            sx={{ fontWeight: 'bold' }}
            startIcon={<DeleteOutlineIcon />}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => !isActivating && setConfirmOpen(false)} maxWidth="xs">
        <DialogTitle fontWeight="bold">
          {confirmType === 'activate' ? 'Activate Campaign?' : 'Delete Campaign?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText color="text.primary">
            {confirmType === 'activate'
              ? 'Are you sure? This generates RSA keys and sends OTPs to all respondents. It cannot be undone.'
              : 'Are you sure you want to permanently delete this campaign? All data, contacts, and questions will be lost forever.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} color="inherit" disabled={isActivating}>Cancel</Button>
          <Button
            onClick={confirmType === 'activate' ? handleActivate : handleDelete}
            color={confirmType === 'activate' ? 'success' : 'error'}
            variant="contained"
            disabled={isActivating}
            autoFocus
          >
            {isActivating ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
            {confirmType === 'activate' ? 'Activate Now' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual distribution warning */}
      {!otpServiceEnabled && campaign.mode === 'active' && (
        <Alert
          severity="warning"
          sx={{ mb: 4, '& .MuiAlert-message': { width: '100%' } }}
          variant="outlined"
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            OTP Sender service is currently not operational.
          </Typography>
          <Typography variant="body2">
            You will need to forward the one-time links to the respondents yourself.
            Find and copy all links on the <Box component={Link} to={`/campaigns/${id}/contacts`} sx={{ color: 'primary.main', fontWeight: 'bold' }}>respondents page</Box>.
          </Typography>
        </Alert>
      )}


      {/* Large section navigation cards */}
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
        {campaign.mode === 'draft' ? (
          <>
            <Paper component={Link} to={`/campaigns/${id}/contacts`} elevation={0} sx={{ flex: 1, p: 4, textDecoration: 'none', color: 'inherit', bgcolor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 2, transition: 'all 0.2s', '&:hover': { borderColor: '#3B82F6', bgcolor: '#EFF6FF', transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(59, 130, 246, 0.15)' } }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main" mb={1}>Manage Contacts</Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                Upload phone numbers or bulk import from files to build the authorized respondent list. They will receive the unique OTPs for feedback.
              </Typography>
            </Paper>
            <Paper component={Link} to={`/campaigns/${id}/questions`} elevation={0} sx={{ flex: 1, p: 4, textDecoration: 'none', color: 'inherit', bgcolor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 2, transition: 'all 0.2s', '&:hover': { borderColor: '#3B82F6', bgcolor: '#EFF6FF', transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(59, 130, 246, 0.15)' } }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main" mb={1}>Manage Questions</Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                Use the form builder to create text feedback, multiple-choice, and rating scale questions for this campaign.
              </Typography>
            </Paper>
          </>
        ) : (
          <>
            <Paper component={Link} to={`/campaigns/${id}/responses`} elevation={0} sx={{ flex: 1, p: 4, textDecoration: 'none', color: 'inherit', bgcolor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 2, transition: 'all 0.2s', '&:hover': { borderColor: '#3B82F6', bgcolor: '#EFF6FF', transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(59, 130, 246, 0.15)' } }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main" mb={1}>Raw Responses</Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                Securely view all cryptographically anonymous tabular responses submitted so far. Identities are mathematically un-linkable.
              </Typography>
            </Paper>
            <Paper component={Link} to={`/campaigns/${id}/insights`} elevation={0} sx={{ flex: 1, p: 4, textDecoration: 'none', color: 'inherit', bgcolor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 2, transition: 'all 0.2s', '&:hover': { borderColor: '#3B82F6', bgcolor: '#EFF6FF', transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(59, 130, 246, 0.15)' } }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main" mb={1}>Analytics & Insights</Typography>
              <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                Access real-time aggregated charts, statistical summaries, and high-level trends isolated from individual user data.
              </Typography>
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
}