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
        top: { xs: 56, sm: 64 }, // altura responsive del navbar
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' }, // Stack en mobile, row en desktop
        overflow: 'hidden',
        
        // fondo responsive
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0, // más limpio que top/left/right/bottom
          bgcolor: 'rgba(156, 156, 156, 0.4)',
          zIndex: 1,
        }}
      />

      {/* Contenido */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          height: '100%',
          width: '100%',
          zIndex: 2, // encima del overlay
        }}
      >
        {/* PANEL LATERAL: Reservas */}
        <Box
          className="reservation-panel" //  Agregar clase
          sx={{
            order: { xs: 2, lg: 1 },
            width: { 
              xs: '100%',
              sm: '100%',
              md: '100%',
              lg: '380px',
              xl: '420px',
            },
            height: { 
              xs: 'auto',
              sm: '45vh',
              md: '40vh',
              lg: '100%',
            },
            minHeight: { xs: '200px', lg: 'auto' },
            maxHeight: { xs: '50vh', lg: 'none' },
            bgcolor: 'rgba(255, 255, 255, 0.95) !important', //  Forzar
            borderRight: { lg: '1px solid rgba(0, 0, 0, 0.1)' },
            borderBottom: { xs: '1px solid rgba(0, 0, 0, 0.1)', lg: 'none' },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header del panel */}
          <Box 
            sx={{ 
              p: { xs: 1.5, sm: 2 },
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              flexShrink: 0,
              bgcolor: 'transparent !important', //  Forzar
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 0,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                color: '#333 !important', //  Forzar color oscuro
                fontWeight: 600,
              }}
            >
              Bienvenido, {user.email.split('@')[0]}!
            </Typography>
          </Box>
          
          {/* Lista de reservas - scroll inteligente */}
          <Box 
            sx={{ 
              flex: 1,
              overflow: { xs: 'auto', lg: 'hidden' }, // Scroll en mobile, hidden en desktop
              p: { xs: 1, sm: 1.5 }, // Padding adaptativo
            }}
          >
            <ReservationsList user={user} />
          </Box>
        </Box>

        {/* MAPA - Completamente responsive */}
        <Box
          sx={{
            order: { xs: 1, lg: 2 },
            flex: 1, // Ocupa el resto del espacio disponible
            height: { 
              xs: '50vh', // Mobile: 50% del viewport
              sm: '55vh', // Tablet: 55%
              md: '60vh', // Tablet landscape: 60%
              lg: '100%', // Desktop: altura completa
            },
            minHeight: { xs: '300px', lg: 'auto' }, // Altura mínima garantizada
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
