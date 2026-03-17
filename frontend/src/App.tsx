import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import { Box, CircularProgress, Typography } from '@mui/material';
import LoginPage from './components/LoginGrid';
import Navbar from './components/Navbar';
import MapGrid from './components/mapGrid';
import RestaurantDashboard from './components/RestaurantDashboard';
import RestaurantLogin from './components/RestaurantLogin';
import { useAuth } from './hooks/useAuth';
import temaPrincipal from '../theme/temaPrincipal';

const FullScreenLoader: React.FC<{ message: string }> = ({ message }) => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background:
        'radial-gradient(circle at top, rgba(255, 115, 85, 0.18), transparent 48%), #fffaf5'
    }}
  >
    <Box sx={{ textAlign: 'center' }}>
      <CircularProgress color="primary" />
      <Typography sx={{ mt: 2 }}>{message}</Typography>
    </Box>
  </Box>
);

const RedirectHandler: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectTarget = params.get('redirect');

    if (!user || !redirectTarget) {
      return;
    }

    if (!redirectTarget.startsWith('/')) {
      return;
    }

    navigate(redirectTarget, { replace: true });
  }, [location.search, navigate, user]);

  return null;
};

const AppRoutes: React.FC = () => {
  const { user, restaurant, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader message="Cargando tu cuenta..." />;
  }

  const fallbackRoute = restaurant ? '/restaurant/dashboard' : user ? '/map' : '/';

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/map" replace />
          ) : restaurant ? (
            <Navigate to="/restaurant/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/map"
        element={
          user ? (
            <>
              <Navbar />
              <MapGrid user={user} />
            </>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/restaurant/login"
        element={
          restaurant ? <Navigate to="/restaurant/dashboard" replace /> : <RestaurantLogin />
        }
      />
      <Route
        path="/restaurant/dashboard"
        element={
          restaurant ? <RestaurantDashboard /> : <Navigate to="/restaurant/login" replace />
        }
      />
      <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <Router>
    <RedirectHandler />
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <ThemeProvider theme={temaPrincipal}>
        <AppRoutes />
      </ThemeProvider>
    </LocalizationProvider>
  </Router>
);

export default App;
