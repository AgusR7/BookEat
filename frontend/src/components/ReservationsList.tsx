import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User } from '../hooks/useAuth';
import { Height } from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

interface Reservation {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  reservation_at: string;
  requested_guests: number;   // nuevo
  guests: number;             // par, sigue estando por si acaso
}

interface Props {
  user: User;
}

const ReservationsList: React.FC<Props> = ({ user }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  const fetchReservations = () => {
    setLoading(true);
    axios
      .get<Reservation[]>('/api/reservations', { withCredentials: true })
      .then((res) => setReservations(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReservations();
    const handler = () => fetchReservations();
    window.addEventListener('reservation-made', handler);
    window.addEventListener('reservation-cancelled', handler);
    return () => {
      window.removeEventListener('reservation-made', handler);
      window.removeEventListener('reservation-cancelled', handler);
    };
  }, []);

  const handleCancel = (id: number) => {
    if (!window.confirm('¿Seguro que desea cancelar esta reserva?')) return;
    axios
      .delete(`/api/reservations/${id}`, { withCredentials: true })
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Reserva cancelada',
          severity: 'success'
        });
        window.dispatchEvent(new Event('reservation-cancelled'));
      })
      .catch((err) =>
        setSnackbar({
          open: true,
          message: err.response?.data?.error || 'Error al cancelar',
          severity: 'error'
        })
      );
  };

  if (loading) return <p>Cargando reservas...</p>;
  if (reservations.length === 0) return <p>No tienes reservas.</p>;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div style={{ 
      marginTop: 20
    }}>
      <h2>Mis Reservas</h2>
      <ul>
        {reservations.map((r) => (
          <li key={r.id} style={{ marginBottom: 10 }}>
            {r.restaurant_name} - {formatDate(r.reservation_at)} - {r.requested_guests} personas
            <button onClick={() => handleCancel(r.id)} style={{ marginLeft: '10px' }}>
              Cancelar
            </button>
          </li>
        ))}
      </ul>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ReservationsList;
