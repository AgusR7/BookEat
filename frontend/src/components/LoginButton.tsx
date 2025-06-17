// src/components/LoginButton.tsx
import React, { useState } from 'react';
import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import CircularProgress from '@mui/material/CircularProgress';

const LoginButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    window.location.href = `http://localhost:3001/api/auth/google`;
  };

  return (
    <Button
      variant="contained"
      onClick={handleLogin}
      disabled={loading}
      startIcon={
        loading ? (
          <CircularProgress size={20} />
        ) : (
          <GoogleIcon sx={{ color: '#fff' }} /> //  Ícono blanco
        )
      }
      sx={{
        bgcolor: '#ff3b59', //  Fondo del color primario
        color: '#fff', //  Texto blanco
        '&:hover': {
          bgcolor: '#e5334a', //  Hover más oscuro
        },
        '&:disabled': {
          bgcolor: '#ffb3c1', //  Disabled más claro
          color: '#fff',
        },
        borderRadius: 2,
        px: 4,
        py: 1.5,
        fontSize: '1rem',
        fontWeight: 500,
      }}
    >
      {loading ? 'Iniciando sesión...' : 'Iniciar sesión con Google'}
    </Button>
  );
};

export default LoginButton;