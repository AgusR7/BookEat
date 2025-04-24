// frontend/src/App.tsx
import React from 'react';
import LoginPage from './components/LoginGrid';
import Map from './components/Map';
import ReservationsList from './components/ReservationsList';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Cargando usuario...</p>;
  }

  // Si no hay usuario, mostramos toda la pantalla de login
  if (!user) {
    return <LoginPage />;
  }

  // Ya está logueado: mostramos el dashboard
  return (
    <div className="App" style={{ padding: 16 }}>
      <p>Bienvenido, {user.email}</p>
      <Map user={user} />
      <ReservationsList user={user} />
    </div>
  );
};

export default App;

