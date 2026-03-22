import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Box, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Paper, IconButton, Tooltip,
  Skeleton, Alert, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import { campaignsAPI } from '../api/Client.js';

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Creation Form State
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 1. Load Campaigns from API
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await campaignsAPI.list();
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Create Campaign
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      const data = await campaignsAPI.create(newCampaignName.trim());
      const campaign = data.campaign;

      // If description was provided, update it with a follow-up call
      if (newCampaignDesc.trim()) {
        await campaignsAPI.updateInfo(campaign._id, { description: newCampaignDesc.trim() });
      }

      setIsModalOpen(false);
      setNewCampaignName('');
      setNewCampaignDesc('');
      // Navigate to the new campaign's overview
      navigate(`/campaigns/${campaign._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // 3. Delete Campaign
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this campaign?")) {
      try {
        await campaignsAPI.delete(id);
        setCampaigns(campaigns.filter(c => c._id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // 4. Enable Campaign (Draft to Active — irreversible)
  const handleActivate = async (id) => {
    if (window.confirm("Enable this campaign? This generates RSA keys, OTPs, and prevents further edits. It cannot be undone.")) {
      try {
        const data = await campaignsAPI.activate(id);
        setCampaigns(campaigns.map(c => c._id === id ? data.campaign : c));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={2}
        mb={4}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Campaigns
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsModalOpen(true)}>
          New Campaign
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" flexDirection="column" gap={2}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : campaigns.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px dashed #E2E8F0', borderRadius: 2, bgcolor: 'transparent' }}>
          <Typography color="text.secondary">
            No campaigns yet. Click "New Campaign" to get started.
          </Typography>
        </Paper>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {campaigns.map(camp => (
            <Paper
              key={camp._id}
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: { xs: 2, md: 3 },
                border: '1px solid #E2E8F0',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 25px rgba(37, 99, 235, 0.1)',
                  borderColor: 'secondary.main'
                }
              }}
            >
              {/* LEFT SIDE: Clickable link to the Campaign Overview */}
              <Box
                component={Link}
                to={`/campaigns/${camp._id}`}
                sx={{ textDecoration: 'none', color: 'inherit', flexGrow: 1, display: 'flex', alignItems: 'flex-start', gap: 3, pr: 2 }}
              >
                {/* Glowing Status Dot */}
                <Tooltip title={`Status: ${camp.mode.toUpperCase()}`} placement="top">
                  <Box
                    sx={{
                      width: 12, height: 12, borderRadius: '50%', mt: 1,
                      bgcolor: camp.mode === 'active' ? '#10B981' : '#9CA3AF',
                      boxShadow: camp.mode === 'active' ? '0 0 10px rgba(16, 185, 129, 0.6)' : 'none',
                      flexShrink: 0
                    }}
                  />
                </Tooltip>

                <Box sx={{ width: '100%' }}>
                  <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                    {camp.name}
                  </Typography>

                  {camp.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {camp.description}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.disabled" fontWeight="bold">
                    Created: {new Date(camp.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              {/* RIGHT SIDE: Quick Action Buttons — mode-dependent */}
              <Box display="flex" gap={0.5} flexShrink={0}>

                {camp.mode === 'draft' ? (
                  <>
                    {/* Edit Questions (draft only) */}
                    <Tooltip title="Edit Questions">
                      <IconButton color="primary" onClick={() => navigate(`/campaigns/${camp._id}/questions`)}>
                        <EditNoteOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    {/* Upload Contacts (draft only) */}
                    <Tooltip title="Upload Contacts">
                      <IconButton color="primary" onClick={() => navigate(`/campaigns/${camp._id}/contacts`)}>
                        <GroupAddOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    <Box sx={{ width: '1px', bgcolor: '#E2E8F0', mx: 1, my: 1 }} />

                    {/* Enable Button */}
                    <Tooltip title="Enable Campaign">
                      <IconButton color="success" onClick={() => handleActivate(camp._id)}>
                        <PlayCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    {/* View Responses (active only) */}
                    <Tooltip title="View Responses">
                      <IconButton color="primary" onClick={() => navigate(`/campaigns/${camp._id}/responses`)}>
                        <ListAltOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    {/* View Insights (active only) */}
                    <Tooltip title="View Insights">
                      <IconButton color="secondary" onClick={() => navigate(`/campaigns/${camp._id}/insights`)}>
                        <BarChartOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    <Box sx={{ width: '1px', bgcolor: '#E2E8F0', mx: 1, my: 1 }} />
                  </>
                )}

                {/* Delete Button (Always visible) */}
                <Tooltip title="Delete Campaign">
                  <IconButton color="error" onClick={() => handleDelete(camp._id)}>
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>

              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Creation Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={handleCreate}>
          <DialogTitle fontWeight="bold">Create New Campaign</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus margin="dense" label="Campaign Title" type="text"
              fullWidth variant="outlined" required
              value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)}
              disabled={isCreating}
              sx={{ mt: 1, mb: 2 }}
            />
            <TextField
              margin="dense" label="Small Description (optional)" type="text"
              fullWidth variant="outlined" multiline rows={3}
              placeholder="What is the purpose of this feedback campaign?"
              value={newCampaignDesc} onChange={(e) => setNewCampaignDesc(e.target.value)}
              disabled={isCreating}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setIsModalOpen(false)} color="inherit" sx={{ fontWeight: 'bold' }} disabled={isCreating}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isCreating}>
              {isCreating ? <CircularProgress size={20} color="inherit" /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}