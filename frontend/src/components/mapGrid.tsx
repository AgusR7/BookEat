// frontend/src/components/MapGrid.tsx
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Map from './Map';
import ReservationsList from './ReservationsList';
import { User } from '../hooks/useAuth';
import image from '../../img/img-2025-05-05-18-39-25.png';

interface MapGridProps {
  user: User;
}

const MapGrid: React.FC<MapGridProps> = ({ user }) => {
  return (
    <Box
      component="section"
      sx={{
        position: 'fixed',
        top: 64,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        height: 'calc(100vh - 64px)', // altura total menos la barra de navegación
        width: '100%',
        maxWidth: '100%', 
        overflow: 'hidden', // para evitar scrolls innecesarios


        // fondo con url(...)
        backgroundImage: `url(${image})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          bgcolor: 'rgba(156, 156, 156, 0.4)', // ajustar opacidad al gusto
          zIndex: 1,
        }}
      />

      {/* Contenido */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: '100%',
          width: '100%',
          maxWidth: '100%',
          flex: 1,
          zIndex: 2, // encima del overlay
        }}
      >
        {/* IZQUIERDA: Reservas */}
        <Box
          sx={{
            order: { xs: 2, md: 1 },
            width: { xs: '100%', md: '300px' }, // Fijo en compu, full en celu
            height: { xs: '40vh', md: '100%' },
            bgcolor: 'rgba(255, 255, 255, 0.95)', // fondo blanco con opacidad
            borderRight: {md: '1px solid rgba(0, 0, 0, 0.1)'},
            overflowY: 'hidden', // ocultar scroll vertical
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
              Bienvenido, {user.email}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'hidden', p: 1 }}>
            <ReservationsList user={user} />
          </Box>
        </Box>

        {/* DERECHA: mapa */}
        <Box
          sx={{
            order: { xs: 1, md: 2 },
            flex: 1,
            height: { xs: '60vh', md: '100%' },
            overflow: 'hidden',
          }}
        >
          <Map user={user} />
        </Box>
      </Box>
    </Box>
  );
};

export default MapGrid;
