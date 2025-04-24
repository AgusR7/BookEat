// src/components/LoginButton.tsx
import React from 'react';
import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const LoginButton: React.FC = () => {
  const handleLogin = () => {
    window.location.href = `http://localhost:3001/api/auth/google`;
  };

  return (
    <Button
      variant="contained"
      startIcon={<GoogleIcon />}
      size="large"
      onClick={handleLogin}
      sx={{
        textTransform: 'none',
        fontSize: '1rem',
        paddingX: 3,
        paddingY: 1.5,
        bgcolor: 'primary.main',
        '&:hover': {
          bgcolor: 'primary.dark'
        }
      }}
    >
      Iniciar sesión con Google
    </Button>
  );
};

export default LoginButton;