import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User } from '../hooks/useAuth';
import { Height } from '@mui/icons-material';

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
        window.alert('Reserva cancelada');
        window.dispatchEvent(new Event('reservation-cancelled'));
      })
      .catch((err) => window.alert(err.response?.data?.error || 'Error al cancelar'));
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
    <div style={{ marginTop: 20, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Mis Reservas</h2>
      
      <ul style={{
        maxHeight: '80vh',
        overflowY: 'auto',
        padding: 0,
        margin: 0,
        listStyle: 'none'
      }}>
        {reservations.map((r) => (
          <li key={r.id} style={{
            background: '#fff',
            padding: '1rem',
            marginBottom: '10px',
            borderRadius: '10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div>
              <strong>{r.restaurant_name}</strong>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {formatDate(r.reservation_at)}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {r.requested_guests} persona(s)
              </div>
            </div>
            <button onClick={() => handleCancel(r.id)} style={{
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}>
              Cancelar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

};

export default ReservationsList;
