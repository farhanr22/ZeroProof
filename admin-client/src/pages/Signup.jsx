import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, Box, Typography, TextField, Button, Paper, 
  InputAdornment, IconButton, Link, CircularProgress, Alert
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAddOutlined } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Signup() {
  const { signup } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(email, password);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5}, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #E2E8F0', borderRadius: 2 }}>
        
        <Box sx={{ m: 1, bgcolor: 'primary.main', p: 1.5, borderRadius: '12px', color: 'white' }}>
          <PersonAddOutlined />
        </Box>
        
        <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom color="primary.main">
          Create an Account
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
          Set up your organization to start collecting zero-trust feedback.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSignup} sx={{ width: '100%' }}>
          <TextField
            margin="normal" required fullWidth id="email" label="Organization Email Address"
            autoComplete="email" autoFocus value={email} disabled={isLoading}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal" required fullWidth label="Password" id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password" value={password} disabled={isLoading}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Must be at least 8 characters long"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={isLoading}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button type="submit" fullWidth variant="contained" color="primary" size="large" disabled={isLoading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>

          <Box textAlign="center" mt={1}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight="bold" color="secondary.main" underline="hover">
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}