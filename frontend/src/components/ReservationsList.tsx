import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HistoryIcon from '@mui/icons-material/History';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_BASE_URL } from '../config/env';
import { withAuthHeader } from '../config/authToken';
import { User } from '../hooks/useAuth';
import {
  focusRestaurantOnMap,
  useRestaurantPreferences
} from '../hooks/useRestaurantPreferences';

interface Reservation {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  reservation_at: string;
  requested_guests: number;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'no-show';
}

interface Props {
  user: User;
}

const withBase = (path: string) => new URL(path, API_BASE_URL).toString();

const requestConfig = (headers: Record<string, string> = {}) => ({
  headers: withAuthHeader(headers),
  withCredentials: true
});

const getStatusLabel = (status: Reservation['status']) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    case 'no-show':
      return 'No show';
    default:
      return 'Pendiente';
  }
};

const getStatusColor = (
  status: Reservation['status']
): 'default' | 'success' | 'error' | 'warning' => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'cancelled':
      return 'default';
    case 'no-show':
      return 'error';
    default:
      return 'warning';
  }
};

const ReservationsList: React.FC<Props> = ({ user }) => {
  const { favorites, recentViews, removeFavorite } = useRestaurantPreferences();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'reservations' | 'favorites' | 'recent'>(
    'reservations'
  );
  const [reservationScope, setReservationScope] = useState<'upcoming' | 'history' | 'all'>(
    'upcoming'
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  const fetchReservations = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await axios.get<Reservation[]>(
        withBase('/api/reservations'),
        requestConfig()
      );
      setReservations(response.data);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'No se pudieron cargar tus reservas',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchReservations();

    const handler = () => void fetchReservations(true);
    window.addEventListener('reservation-made', handler);
    window.addEventListener('reservation-cancelled', handler);

    return () => {
      window.removeEventListener('reservation-made', handler);
      window.removeEventListener('reservation-cancelled', handler);
    };
  }, []);

  const sortedReservations = useMemo(
    () =>
      [...reservations].sort(
        (left, right) =>
          new Date(left.reservation_at).getTime() - new Date(right.reservation_at).getTime()
      ),
    [reservations]
  );

  const upcomingCount = useMemo(
    () =>
      sortedReservations.filter(
        (reservation) =>
          new Date(reservation.reservation_at).getTime() >= Date.now() &&
          reservation.status !== 'cancelled'
      ).length,
    [sortedReservations]
  );

  const visibleReservations = useMemo(() => {
    const now = Date.now();

    return sortedReservations.filter((reservation) => {
      if (reservationScope === 'all') {
        return true;
      }

      const isPast = new Date(reservation.reservation_at).getTime() < now;
      if (reservationScope === 'upcoming') {
        return !isPast && reservation.status !== 'cancelled' && reservation.status !== 'no-show';
      }

      return isPast || reservation.status === 'cancelled' || reservation.status === 'no-show';
    });
  }, [reservationScope, sortedReservations]);

  const confirmCancel = async () => {
    if (!selectedReservationId) {
      return;
    }

    try {
      await axios.delete(
        withBase(`/api/reservations/${selectedReservationId}`),
        requestConfig()
      );
      setReservations((current) =>
        current.filter((reservation) => reservation.id !== selectedReservationId)
      );
      setSnackbar({
        open: true,
        message: 'Reserva cancelada',
        severity: 'success'
      });
      window.dispatchEvent(new Event('reservation-cancelled'));
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error al cancelar la reserva',
        severity: 'error'
      });
    } finally {
      setSelectedReservationId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => setActiveTab(value)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Reservas" value="reservations" />
          <Tab label="Favoritos" value="favorites" />
          <Tab label="Recientes" value="recent" />
        </Tabs>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.25 }}>
              {activeTab === 'reservations'
                ? 'Mis reservas'
                : activeTab === 'favorites'
                  ? 'Restaurantes guardados'
                  : 'Vistos recientemente'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 'reservations'
                ? `${user.name.split(' ')[0]}, tienes ${upcomingCount} reserva(s) proxima(s)`
                : activeTab === 'favorites'
                  ? 'Arma tu propia lista para decidir mas rapido.'
                  : 'Retoma restaurantes que ya exploraste en el mapa.'}
            </Typography>
          </Box>

          {activeTab === 'reservations' && (
            <Button
              variant="outlined"
              size="small"
              startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={() => void fetchReservations(true)}
              disabled={isRefreshing}
            >
              Actualizar
            </Button>
          )}
        </Stack>

        {activeTab === 'reservations' && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip
              label="Proximas"
              color={reservationScope === 'upcoming' ? 'primary' : 'default'}
              onClick={() => setReservationScope('upcoming')}
              clickable
            />
            <Chip
              label="Historial"
              color={reservationScope === 'history' ? 'primary' : 'default'}
              onClick={() => setReservationScope('history')}
              clickable
            />
            <Chip
              label="Todas"
              color={reservationScope === 'all' ? 'primary' : 'default'}
              onClick={() => setReservationScope('all')}
              clickable
            />
          </Stack>
        )}

        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
          {activeTab === 'reservations' ? (
            visibleReservations.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  textAlign: 'center',
                  backgroundColor: 'rgba(255,255,255,0.72)'
                }}
              >
                <EventAvailableIcon color="disabled" sx={{ fontSize: 34, mb: 1 }} />
                <Typography variant="subtitle1">Todavia no tienes reservas aqui</Typography>
                <Typography variant="body2" color="text.secondary">
                  Elige un restaurante en el mapa y tu proxima salida aparecera en esta
                  pestana.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={1.25}>
                {visibleReservations.map((reservation) => {
                  const reservationTime = new Date(reservation.reservation_at);
                  const isPast = reservationTime.getTime() < Date.now();
                  const canCancel = !isPast && reservation.status !== 'cancelled';

                  return (
                    <Paper
                      key={reservation.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        borderColor: 'rgba(255, 115, 85, 0.24)',
                        backgroundColor: 'rgba(255,255,255,0.82)'
                      }}
                    >
                      <Stack spacing={1.5} width="100%">
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {reservation.restaurant_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(reservationTime, "EEE d 'de' MMM, HH:mm", {
                                locale: es
                              })}
                            </Typography>
                          </Box>
                          <Chip
                            label={getStatusLabel(reservation.status)}
                            color={getStatusColor(reservation.status)}
                            size="small"
                            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
                          />
                        </Stack>

                        <Divider />

                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          spacing={1}
                        >
                          <Box>
                            <Typography variant="body2">
                              {reservation.requested_guests} persona(s)
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {isPast
                                ? 'Esta reserva ya paso'
                                : 'Aun puedes cancelarla desde aqui'}
                            </Typography>
                          </Box>
                          <Button
                            variant={canCancel ? 'contained' : 'outlined'}
                            color={canCancel ? 'error' : 'inherit'}
                            startIcon={<EventBusyIcon />}
                            disabled={!canCancel}
                            onClick={() => setSelectedReservationId(reservation.id)}
                          >
                            Cancelar
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )
          ) : activeTab === 'favorites' ? (
            favorites.length === 0 ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  textAlign: 'center',
                  backgroundColor: 'rgba(255,255,255,0.72)'
                }}
              >
                <FavoriteIcon color="disabled" sx={{ fontSize: 34, mb: 1 }} />
                <Typography variant="subtitle1">Aun no guardaste restaurantes</Typography>
                <Typography variant="body2" color="text.secondary">
                  Usa el boton Guardar dentro de la ficha del restaurante para armar tu lista.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={1.25}>
                {favorites.map((favorite) => (
                  <Paper
                    key={favorite.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.82)'
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {favorite.name}
                        </Typography>
                        {favorite.neighborhood && (
                          <Typography variant="body2" color="text.secondary">
                            {favorite.neighborhood}
                          </Typography>
                        )}
                        {favorite.address && (
                          <Typography variant="caption" color="text.secondary">
                            {favorite.address}
                          </Typography>
                        )}
                      </Box>

                      {favorite.tags && favorite.tags.length > 0 && (
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                          {favorite.tags.slice(0, 3).map((tag) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      )}

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          startIcon={<MapOutlinedIcon />}
                          onClick={() => focusRestaurantOnMap(favorite.id)}
                        >
                          Ver en mapa
                        </Button>
                        <Button
                          size="small"
                          color="inherit"
                          onClick={() => removeFavorite(favorite.id)}
                        >
                          Quitar
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )
          ) : recentViews.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.72)'
              }}
            >
              <HistoryIcon color="disabled" sx={{ fontSize: 34, mb: 1 }} />
              <Typography variant="subtitle1">Todavia no exploraste restaurantes</Typography>
              <Typography variant="body2" color="text.secondary">
                Cada restaurante que abras en el mapa aparecera aqui para retomarlo rapido.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.25}>
              {recentViews.map((restaurant) => (
                <Paper
                  key={restaurant.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.82)'
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {restaurant.name}
                      </Typography>
                      {restaurant.neighborhood && (
                        <Typography variant="body2" color="text.secondary">
                          {restaurant.neighborhood}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      startIcon={<MapOutlinedIcon />}
                      onClick={() => focusRestaurantOnMap(restaurant.id)}
                    >
                      Abrir
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Box>

      <Dialog
        open={selectedReservationId !== null}
        onClose={() => setSelectedReservationId(null)}
        aria-labelledby="cancel-reservation-title"
        aria-describedby="cancel-reservation-description"
      >
        <DialogTitle id="cancel-reservation-title">Cancelar reserva</DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-reservation-description">
            Esta accion liberara la mesa y notificara al restaurante. Quieres continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedReservationId(null)}>Volver</Button>
          <Button color="error" onClick={() => void confirmCancel()} autoFocus>
            Si, cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReservationsList;
