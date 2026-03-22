import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Typography, Button, Paper, Box, Divider, Skeleton, Alert, CircularProgress } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { campaignsAPI } from '../api/Client.js';

export default function CampaignOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await campaignsAPI.get(id);
      setCampaign(data.campaign);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    if (window.confirm("Are you sure? This generates RSA keys and sends OTPs. It cannot be undone.")) {
      setIsActivating(true);
      setError(null);
      try {
        const data = await campaignsAPI.activate(id);
        setCampaign(data.campaign);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsActivating(false);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this campaign?")) {
      try {
        await campaignsAPI.delete(id);
        navigate('/campaigns');
      } catch (err) {
        setError(err.message);
      }
    }
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

      <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px solid #E2E8F0' }}>
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">{campaign.name}</Typography>
            {campaign.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {campaign.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Status: <strong>{campaign.mode.toUpperCase()}</strong>
            </Typography>
          </Box>

          <Box display="flex" gap={1}>
            {campaign.mode === 'draft' && (
              <Button
                variant="contained" color="error"
                startIcon={isActivating ? <CircularProgress size={18} color="inherit" /> : <WarningAmberIcon />}
                onClick={handleActivate}
                disabled={isActivating}
              >
                Enable Campaign
              </Button>
            )}
            <Button variant="outlined" color="error" onClick={handleDelete}>
              Delete
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Smooth Hover Navigation Buttons — mode-dependent */}
        <Box display="flex" gap={2} flexWrap="wrap">
          {campaign.mode === 'draft' ? (
            <>
              <Button component={Link} to={`/campaigns/${id}/contacts`} variant="outlined" sx={{ transition: 'all 0.2s', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                Manage Contacts
              </Button>
              <Button component={Link} to={`/campaigns/${id}/questions`} variant="outlined" sx={{ transition: 'all 0.2s', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                Manage Questions
              </Button>
            </>
          ) : (
            <>
              <Button component={Link} to={`/campaigns/${id}/responses`} variant="contained" color="primary" sx={{ boxShadow: 'none' }}>
                View Responses
              </Button>
              <Button component={Link} to={`/campaigns/${id}/insights`} variant="contained" color="secondary" sx={{ boxShadow: 'none' }}>
                View Insights
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}