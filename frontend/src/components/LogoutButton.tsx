// src/components/LogoutButton.tsx
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../hooks/useAuth';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export function LogoutButton() {
  const { logout } = useAuth();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = 'http://localhost:5173/';
    } catch {
      setSnackbar({
        open: true,
        message: 'No se pudo cerrar sesión',
        severity: 'error'
      });
    }
  };

  return (
    <>
      <Button id="logoutbutton"
        variant="contained"
        color="inherit"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        disableElevation
        sx={{
          textTransform: 'none',
          borderRadius: 0,
          m: 1,
          px: 3,
          py: 1.25,
        }}
      >
        Cerrar sesión
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default LogoutButton;
