import React, { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import GoogleIcon from '@mui/icons-material/Google';
import { Button } from '@mui/material';
import { API_BASE_URL } from '../config/env';

const LoginButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    window.location.href = new URL('/api/auth/google', API_BASE_URL).toString();
  };

  return (
    <Button
      variant="contained"
      onClick={handleLogin}
      disabled={loading}
      startIcon={
        loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon sx={{ color: '#fff' }} />
      }
      sx={{
        minWidth: 280,
        color: '#fff'
      }}
    >
      {loading ? 'Iniciando sesion...' : 'Iniciar sesion con Google'}
    </Button>
  );
};

export default LoginButton;
