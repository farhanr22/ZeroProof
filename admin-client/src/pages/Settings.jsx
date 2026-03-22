import React, { useState } from 'react';
import { 
  Container, Typography, Box, Button, TextField, Alert, 
  CircularProgress, Divider, InputAdornment, IconButton, Paper, Chip
} from '@mui/material';
import { useAuth } from '../hooks/useAuth.jsx';
import { Visibility, VisibilityOff, SecurityOutlined, EmailOutlined } from '@mui/icons-material';

export default function Settings() {
  const { user, changePassword } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill out all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message || 'Failed to change password.');
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 6 }, mb: 8 }}>
      
      {/* Account Info */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <EmailOutlined color="secondary" />
          <Typography variant="h6" fontWeight="bold">Account</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="body1" color="text.secondary">Signed in as</Typography>
          <Chip label={user?.email || '—'} variant="outlined" color="secondary" size="small" sx={{ fontWeight: 600 }} />
        </Box>
      </Paper>
      
      {/* Password Change */}
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
          <SecurityOutlined color="secondary" />
          <Typography variant="h6" fontWeight="bold">Change Password</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          You will be logged out of all sessions after changing your password.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <Box component="form" onSubmit={handlePasswordChange}>
          <TextField
            size="small" required fullWidth label="Current Password"
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword} disabled={isLoading}
            onChange={(e) => setCurrentPassword(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowCurrent(!showCurrent)} edge="end" disabled={isLoading}>
                    {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Divider sx={{ my: 2, borderColor: '#F1F5F9' }} />
          
          <TextField
            size="small" required fullWidth label="New Password"
            type={showNew ? 'text' : 'password'}
            value={newPassword} disabled={isLoading}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Min 8 characters"
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowNew(!showNew)} edge="end" disabled={isLoading}>
                    {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            size="small" required fullWidth label="Confirm New Password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword} disabled={isLoading}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 2.5 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)} edge="end" disabled={isLoading}>
                    {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button 
            type="submit"
            variant="contained" 
            color="primary" 
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            sx={{ py: 1 }}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}