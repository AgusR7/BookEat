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
    <Button id="logoutbutton"
      variant="contained"
      color="inherit"
      startIcon={<LogoutIcon />}
      onClick={handleLogout}
      disableElevation 
      sx={{
        textTransform: 'none',
        disableElevation: true,
        borderRadius: 0,   
        m: 1,
        px: 3,
        py: 1.25,
      }}
    >
      Cerrar sesión
    </Button>
  );
}

export default LogoutButton;
