import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ButtonGroup,
  Badge
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Reservation {
  id: number;
  user_id: number;
  restaurant_id: number;
  reservation_at: string;
  requested_guests: number;
  guests: number;
  status: string;
  presence_confirmed: boolean;
  presence_confirmed_at: string | null;
  user_name: string;
  user_email: string;
}

const RestaurantDashboard: React.FC = () => {
  const { restaurant } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [hasNewReservation, setHasNewReservation] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' as 'success' | 'info' | 'warning' | 'error' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [confirmAction, setConfirmAction] = useState<'attend' | 'no-show' | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualiza cada 1 minuto
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    setSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    if (!restaurant || restaurant.role !== 'restaurant') {
      navigate('/restaurant/login');
      return;
    }

    fetchReservations();

    if (socket && restaurant.restaurant_id) {
      socket.emit('join_restaurant_room', restaurant.restaurant_id);
    }

    const handleNewReservation = (data: { reservation: Reservation }) => {
      setReservations(prev => [data.reservation, ...prev].sort((a, b) => new Date(b.reservation_at).getTime() - new Date(a.reservation_at).getTime()));
      setHasNewReservation(true);
      setNotification({
        open: true,
        message: `¡Nueva reserva de ${data.reservation.user_name}! ${data.reservation.requested_guests} personas para ${format(new Date(data.reservation.reservation_at), 'PPp', { locale: es })}`,
        severity: 'success'
      });
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    };

    const handleReservationUpdated = (data: { reservation_id: number; presence_confirmed: boolean; status: string }) => {
      setReservations(prev => prev.map(r => r.id === data.reservation_id ? {
        ...r,
        presence_confirmed: data.presence_confirmed,
        status: data.status,
        presence_confirmed_at: data.presence_confirmed ? new Date().toISOString() : null
      } : r));
      setNotification({
        open: true,
        message: `Reserva ID ${data.reservation_id} actualizada a: ${data.status === 'confirmed' && data.presence_confirmed ? 'Asistió' : data.status === 'no-show' && !data.presence_confirmed ? 'No Asistió' : data.status}`,
        severity: 'info'
      });
    };

    if (socket) {
      socket.on('connection_established', () => {});
      socket.on('joined_room', () => {});
      socket.on('new_reservation', handleNewReservation);
      socket.on('reservation_updated', handleReservationUpdated);
      if (!socket.connected) socket.connect();
    }

    return () => {
      socket.off('connection_established');
      socket.off('joined_room');
      socket.off('new_reservation');
      socket.off('reservation_updated');
    };
  }, [restaurant, navigate, socket]);

  useEffect(() => {
    if (hasNewReservation) {
      const timer = setTimeout(() => setHasNewReservation(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasNewReservation]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/restaurants/reservations', { credentials: 'include' });
      if (!response.ok) throw new Error('Error al cargar las reservas iniciales');
      const data = await response.json();
      setReservations(data.sort((a: Reservation, b: Reservation) => new Date(b.reservation_at).getTime() - new Date(a.reservation_at).getTime()));
    } catch (error: any) {
      setNotification({ open: true, message: error.message || 'Error al cargar las reservas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirmDialog = (reservation: Reservation, action: 'attend' | 'no-show') => {
    setSelectedReservation(reservation);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedReservation(null);
    setConfirmAction(null);
  };

  const handleUpdatePresenceStatus = async () => {
    if (!selectedReservation || confirmAction === null) return;
    const present = confirmAction === 'attend';
    const originalReservation = selectedReservation;
    handleCloseConfirmDialog();
    setReservations(prev => prev.map(r => r.id === originalReservation.id ? { ...r, presence_confirmed: present, status: present ? 'confirmed' : 'no-show', presence_confirmed_at: present ? new Date().toISOString() : null } : r));
    try {
      const response = await fetch(`/api/restaurants/reservations/${originalReservation.id}/confirm-presence`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ present })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido al actualizar estado' }));
        setReservations(prev => prev.map(r => r.id === originalReservation.id ? originalReservation : r));
        throw new Error(errorData.error || 'Error al actualizar estado de presencia');
      }
      setNotification({ open: true, message: present ? 'Cliente marcado como ASISTIÓ' : 'Cliente marcado como NO ASISTIÓ', severity: 'success' });
    } catch (error: any) {
      setReservations(prev => prev.map(r => r.id === originalReservation.id ? originalReservation : r));
      setNotification({ open: true, message: error.message || 'Error al actualizar estado', severity: 'error' });
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const getStatusText = (status: string, presence_confirmed: boolean) => {
    if (status === 'confirmed' && presence_confirmed) return 'Asistió';
    if (status === 'no-show' && !presence_confirmed) return 'No Asistió';
    if (status === 'pending') return 'Pendiente';
    if (status === 'cancelled') return 'Cancelada';
    return status;
  };

  const handleRefresh = () => {
    fetchReservations();
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Panel de Control - {restaurant?.name || 'Restaurante'}</Typography>
        <Box>
          <Badge color={socketConnected ? 'success' : 'error'} variant="dot" sx={{ mr: 2 }}>
            <Typography variant="body2">Socket: {socketConnected ? 'Conectado' : 'Desconectado'}</Typography>
          </Badge>
          <Button variant="outlined" onClick={handleRefresh} size="small">Refrescar Reservas</Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha y Hora</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Comensales</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No hay reservas para este restaurante.</TableCell>
              </TableRow>
            ) : (
              reservations.map((reservation) => {
                const now = currentTime;
                const reservationTime = new Date(reservation.reservation_at);
                const fifteenMinutesAfter = new Date(reservationTime.getTime() + 15 * 60000);

                const isAssistButtonEnabled = now >= reservationTime;
                const isNoShowButtonEnabled = now >= fifteenMinutesAfter;
                const isButtonBlocked = ['confirmed', 'no-show', 'cancelled'].includes(reservation.status);

                return (
                  <TableRow key={reservation.id} sx={{ backgroundColor: hasNewReservation && reservation === reservations[0] ? 'rgba(0, 200, 83, 0.1)' : 'inherit' }}>
                    <TableCell>{format(new Date(reservation.reservation_at), 'PPp', { locale: es })}</TableCell>
                    <TableCell>{reservation.user_name}</TableCell>
                    <TableCell>{reservation.user_email}</TableCell>
                    <TableCell>{reservation.requested_guests}</TableCell>
                    <TableCell>{getStatusText(reservation.status, reservation.presence_confirmed)}</TableCell>
                    <TableCell>
                      <ButtonGroup variant="outlined" size="small">
                        <Button
                          color="success"
                          onClick={() => handleOpenConfirmDialog(reservation, 'attend')}
                          disabled={!isAssistButtonEnabled || isButtonBlocked}
                          style={{ opacity: isAssistButtonEnabled && !isButtonBlocked ? 1 : 0.5 }}
                        >
                          Asistió
                        </Button>
                        <Button
                          color="error"
                          onClick={() => handleOpenConfirmDialog(reservation, 'no-show')}
                          disabled={!isNoShowButtonEnabled || isButtonBlocked}
                          style={{ opacity: isNoShowButtonEnabled && !isButtonBlocked ? 1 : 0.5 }}
                        >
                          No Asistió
                        </Button>
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirmar Acción</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres marcar esta reserva como {confirmAction === 'attend' ? 'ASISTIÓ' : 'NO ASISTIÓ'}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
          <Button onClick={handleUpdatePresenceStatus} autoFocus color={confirmAction === 'attend' ? 'success' : 'error'}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RestaurantDashboard;