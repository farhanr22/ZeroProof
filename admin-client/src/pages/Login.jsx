import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, Box, Typography, TextField, Button, Paper, 
  InputAdornment, IconButton, Link, CircularProgress, Alert 
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth.jsx'; 

export default function Login() {
  const { login } = useAuth(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p:{xs : 4,sm:5}, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #E2E8F0' }}>
        
        <Box sx={{ m: 1, bgcolor: 'secondary.main', p: 1.5, borderRadius: '12px', color: 'white' }}>
          <LockOutlined />
        </Box>
        
        <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Sign in to manage your campaigns
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
          <TextField
            margin="normal" required fullWidth id="email" label="Email Address"
            autoFocus value={email} disabled={isLoading}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal" required fullWidth label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password} disabled={isLoading}
            onChange={(e) => setPassword(e.target.value)}
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
          
          <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>

          <Box textAlign="center">
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link component={RouterLink} to="/signup" fontWeight="bold" color="secondary.main" underline="hover">
                Sign up here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}