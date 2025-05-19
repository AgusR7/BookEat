import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LoginButton from './LoginButton';
import LocalAuthForm from './LocalAuthForm';
import illustration from '../../img/outdoor-dining-1846137_1920.jpg';
import Divider from '@mui/material/Divider';

const LoginPage: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
      }}
    >
      <Box
        component={'img'}
        src={illustration}
        alt="Imagen de fondo"
        sx={{
          flex: 1,
          bgcolor: 'grey.100',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      />

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
        <Typography variant="h2" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
          Book
          <Box component={'span'} sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Eat
          </Box>
        </Typography>
        <Typography variant="h6" component="h2" textAlign="center" gutterBottom sx={{ mb: 4 }}>
          Explora, elige, reserva. Así de simple.
        </Typography>

        <LocalAuthForm />

        <Box sx={{ width: '100%', maxWidth: 400, mt: 3, mb: 3 }}>
          <Divider>
            <Typography variant="body2" color="text.secondary">
              o continúa con
            </Typography>
          </Divider>
        </Box>

        <LoginButton />
      </Box>
    </Box>
  );
};

export default LoginPage;
