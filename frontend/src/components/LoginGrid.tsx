
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LoginButton from './LoginButton';

const LoginPage: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
      }}
    >
      {/* IZQUIERDA: placeholder para imagen */}
      <Box
        sx={{
          flex: 1,
          bgcolor: 'grey.100',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* aquí insertaremos la imagen más adelante */}
      </Box>

      {/* DERECHA: contenido de login */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          BookEat
        </Typography>
        <Typography variant="h6" component="h2" textAlign="center" gutterBottom>
          Explora, elige, reserva. Así de simple.
        </Typography>
        <LoginButton />
      </Box>
    </Box>
  );
};

export default LoginPage;
