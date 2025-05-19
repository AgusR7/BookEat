// frontend/src/App.tsx
import React from 'react';
import LoginPage from './components/LoginGrid';
import { useAuth } from './hooks/useAuth';
import temaPrincipal from '../theme/temaPrincipal';
import Navbar from './components/Navbar';
import { ThemeProvider } from '@emotion/react';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale/es';
import MapGrid from './components/mapGrid';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Cargando usuario...</p>;
  }

  return (
    <Router>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <ThemeProvider theme={temaPrincipal}>
          <Routes>
            <Route
              path="/"
              element={user ? <Navigate to="/map" replace /> : <LoginPage />}
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
          </Routes>
        </ThemeProvider>
      </LocalizationProvider>
    </Router>
  );
};

export default App;

