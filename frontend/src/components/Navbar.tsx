import * as React from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Container,
  Divider,
  IconButton,
  Menu,
  Toolbar,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LogoutButton from './LogoutButton';
import LogoWhite from '../../img/logo_bookeat_white.png';

const getInitials = (name?: string, email?: string) => {
  const source = (name || email || 'U').trim();
  const pieces = source.split(/\s+/).filter(Boolean);

  return pieces
    .slice(0, 2)
    .map((piece) => piece[0]?.toUpperCase() ?? '')
    .join('');
};

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userAnchor, setUserAnchor] = React.useState<null | HTMLElement>(null);

  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'BookEater';

  return (
    <AppBar position="sticky" color="primary">
      <Container maxWidth={false}>
        <Toolbar disableGutters sx={{ gap: 1.5, minHeight: { xs: 56, sm: 64 } }}>
          <Box
            component="button"
            type="button"
            onClick={() => navigate('/map')}
            sx={{
              border: 0,
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box
              component="img"
              src={LogoWhite}
              alt="BookEat"
              sx={{ height: { xs: 34, sm: 40 } }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              Hola, {firstName}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,250,247,0.86)',
                display: { xs: 'none', sm: 'block' },
                lineHeight: 1.15
              }}
            >
              Explora restaurantes, guarda favoritos y reserva en tiempo real.
            </Typography>
          </Box>

          <IconButton
            color="inherit"
            aria-label="Abrir menu de usuario"
            onClick={(event) => setUserAnchor(event.currentTarget)}
            sx={{ p: 0.25 }}
          >
            <Avatar
              alt={user?.name || user?.email || 'Usuario'}
              src={user?.picture || undefined}
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                bgcolor: user?.picture ? 'transparent' : 'rgba(255,255,255,0.22)',
                color: 'common.white',
                fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.28)'
              }}
            >
              {getInitials(user?.name, user?.email)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={userAnchor}
            open={Boolean(userAnchor)}
            onClose={() => setUserAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                width: 260,
                p: 1.25,
                borderRadius: 3
              }
            }}
          >
            <Box sx={{ px: 1, py: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {user?.name || 'Usuario'}
              </Typography>
              {user?.email && (
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              )}
            </Box>
            <Divider sx={{ my: 1 }} />
            <LogoutButton />
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
