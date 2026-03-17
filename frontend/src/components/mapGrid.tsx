import React from 'react';
import { Box, Typography } from '@mui/material';
import Map from './Map';
import ReservationsList from './ReservationsList';
import { User } from '../hooks/useAuth';
import image from '../../img/img-2025-05-05-18-39-25.png';

interface MapGridProps {
  user: User;
}

const MapGrid: React.FC<MapGridProps> = ({ user }) => {
  const firstName = user.name.split(' ')[0] || user.email.split('@')[0];

  return (
    <Box
      component="section"
      sx={{
        position: 'fixed',
        top: { xs: 56, sm: 64 },
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        overflow: 'hidden',
        backgroundImage: `linear-gradient(180deg, rgba(255, 249, 244, 0.78), rgba(255, 249, 244, 0.7)), url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', lg: 420 },
          maxWidth: { lg: 460 },
          height: { xs: '42vh', lg: '100%' },
          minHeight: { xs: 260, lg: '100%' },
          backgroundColor: 'rgba(255,255,255,0.76)',
          backdropFilter: 'blur(16px)',
          borderRight: { lg: '1px solid rgba(15, 23, 42, 0.08)' },
          borderBottom: { xs: '1px solid rgba(15, 23, 42, 0.08)', lg: 'none' },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
          <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: '0.08em' }}>
            Tu agenda gastronomica
          </Typography>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Bienvenido, {firstName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Revisa tus reservas activas y administra tus proximas salidas desde un solo
            lugar.
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', p: 2 }}>
          <ReservationsList user={user} />
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: { xs: '58vh', lg: '100%' }
        }}
      >
        <Map user={user} />
      </Box>
    </Box>
  );
};

export default MapGrid;
