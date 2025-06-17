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
        //  Responsive: stack vertical en celu
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      {/* IZQUIERDA: Imagen */}
      <Box
        component={'img'}
        src={illustration}
        alt="Imagen de fondo"
        sx={{
          flex: 1,
          bgcolor: 'grey.100',
          display: { xs: 'none', md: 'flex' }, //  Ocultar en celu
          justifyContent: 'center',
          alignItems: 'center',
          width: { md: '60%', lg: '70%' },
          objectFit: 'cover',
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
          p: { xs: 3, md: 5 }, //  Padding responsive
          bgcolor: 'background.default', //  Fondo del tema
          minHeight: { xs: '100vh', md: 'auto' }, //  Altura completa en celu
        }}
      >
        {/* Título  */}
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          sx={{ 
            textAlign: 'center',
            color: 'text.primary', //  Color del tema
            fontSize: { xs: '2rem', md: '3rem' }, //  Responsive
          }}
        >
          Book
          <Box 
            component={'span'} 
            sx={{ 
              color: 'primary.main', // Color específico para "Eat"
              fontWeight: 'bold' 
            }}
          >
            Eat
          </Box>
        </Typography>

        {/* Subtítulo */}
        <Typography 
          variant="h6" 
          component="h2" 
          textAlign="center" 
          gutterBottom 
          sx={{ 
            mb: 4,
            color: 'text.secondary', //  Color del tema
            fontSize: { xs: '1rem', md: '1.25rem' }, //  Responsive
          }}
        >
          Explora, elige, reserva. Así de simple.
        </Typography>

        {/* Formulario local */}
        <LocalAuthForm />

        {/* Divider */}
        <Box sx={{ width: '100%', maxWidth: 400, mt: 3, mb: 3 }}>
          <Divider>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary' //  Color del tema
              }}
            >
              o continúa con
            </Typography>
          </Divider>
        </Box>

        {/* Botón de Google */}
        <LoginButton />
      </Box>
    </Box>
  );
};

export default LoginPage;
