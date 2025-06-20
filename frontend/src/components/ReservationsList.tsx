import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User } from '../hooks/useAuth';
import { Height } from '@mui/icons-material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

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
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);

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
    setSelectedReservationId(id);
    setOpenCancelDialog(true);
  };

  const confirmCancel = () => {
    if (selectedReservationId) {
      axios
        .delete(`/api/reservations/${selectedReservationId}`, { withCredentials: true })
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
        )
        .finally(() => {
          setOpenCancelDialog(false);
          setSelectedReservationId(null);
        });
    }
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
        // overflowY: 'auto',
        padding: 0,
        margin: 0,
        listStyle: 'none',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '8px',
      }}>
        {reservations.map((r) => (
          <li key={r.id} style={{
            background: '#fff',
            padding: '1rem',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
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
              backgroundColor: '#FF3B59',
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
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirmar Cancelación"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Seguro que desea cancelar esta reserva?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>No</Button>
          <Button onClick={confirmCancel} autoFocus>
            Sí
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );

};

export default ReservationsList;
