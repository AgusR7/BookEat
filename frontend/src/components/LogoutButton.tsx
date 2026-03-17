import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';
import Snackbar from '@mui/material/Snackbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      setSnackbar({
        open: true,
        message: 'No se pudo cerrar sesion',
        severity: 'error'
      });
    }
  };

  return (
    <>
      <Button
        id="logoutbutton"
        fullWidth
        variant="outlined"
        color="inherit"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
        sx={{
          justifyContent: 'flex-start',
          borderRadius: 2,
          color: 'text.primary',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'divider',
            backgroundColor: 'action.hover'
          }
        }}
      >
        Cerrar sesion
      </Button>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
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
