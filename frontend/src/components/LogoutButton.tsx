// src/components/LogoutButton.tsx
import React from 'react';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/useAuth';

export function LogoutButton() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = 'http://localhost:5173/';
    } catch {
      alert('No se pudo cerrar sesión');
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
      disableElevation 
      sx={{
        textTransform: 'none',
        borderRadius: 2.5,   
        mt: 2,
        px: 3,
        py: 1.25,
      }}
    >
      Cerrar sesión
    </Button>
  );
}

export default LogoutButton;
