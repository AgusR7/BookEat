import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import illustration from '../../img/outdoor-dining-1846137_1920.jpg';

const RestaurantLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { restaurantLogin } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await restaurantLogin(email, password);
      navigate('/restaurant/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
        backgroundColor: 'background.default'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: { xs: 'none', lg: 'block' },
          overflow: 'hidden'
        }}
      >
        <Box
          component="img"
          src={illustration}
          alt="Salon de restaurante"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15,23,42,0.15), rgba(15,23,42,0.65))',
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            color: 'common.white'
          }}
        >
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Gestion de reservas
          </Typography>
          <Typography variant="h3" sx={{ maxWidth: 460 }}>
            Manten el servicio del restaurante sincronizado en tiempo real.
          </Typography>
          <Typography sx={{ maxWidth: 460, color: 'rgba(255,255,255,0.82)' }}>
            Revisa nuevas reservas, confirma asistencia y sigue el estado del salon desde
            un panel disenado para el equipo.
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          p: { xs: 3, md: 5 }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 460,
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            border: '1px solid rgba(15,23,42,0.08)'
          }}
        >
          <Typography variant="overline" sx={{ color: 'primary.main' }}>
            BookEat para restaurantes
          </Typography>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Inicia sesion
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Usa las credenciales del restaurante para acceder al panel operativo.
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              margin="normal"
              required
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
                  Iniciando...
                </>
              ) : (
                'Entrar al panel'
              )}
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default RestaurantLogin;
