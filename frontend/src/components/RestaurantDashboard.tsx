import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_BASE_URL } from '../config/env';
import { withAuthHeader } from '../config/authToken';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

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

type ReservationScope = 'today' | 'upcoming' | 'history' | 'all';
type ReservationStatusFilter =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'attended'
  | 'no-show'
  | 'cancelled';
type DerivedReservationStatus = Exclude<ReservationStatusFilter, 'all'>;
type NotificationState = {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
};

const NO_SHOW_DELAY_MS = 15 * 60 * 1000;

const scopeOptions: Array<{ value: ReservationScope; label: string }> = [
  { value: 'today', label: 'Hoy' },
  { value: 'upcoming', label: 'Proximas' },
  { value: 'history', label: 'Historial' },
  { value: 'all', label: 'Todas' }
];

const statusOptions: Array<{ value: ReservationStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'attended', label: 'Asistio' },
  { value: 'no-show', label: 'No show' },
  { value: 'cancelled', label: 'Cancelada' }
];

const withBase = (path: string) => new URL(path, API_BASE_URL).toString();

const isSameServiceDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const getDerivedStatus = (reservation: Reservation): DerivedReservationStatus => {
  if (reservation.status === 'no-show') {
    return 'no-show';
  }

  if (reservation.status === 'cancelled') {
    return 'cancelled';
  }

  if (reservation.status === 'confirmed' && reservation.presence_confirmed) {
    return 'attended';
  }

  if (reservation.status === 'confirmed') {
    return 'confirmed';
  }

  return 'pending';
};

const getStatusLabel = (reservation: Reservation) => {
  switch (getDerivedStatus(reservation)) {
    case 'attended':
      return 'Asistio';
    case 'confirmed':
      return 'Confirmada';
    case 'no-show':
      return 'No show';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Pendiente';
  }
};

const getStatusColor = (
  status: DerivedReservationStatus
): 'default' | 'success' | 'error' | 'info' | 'warning' => {
  switch (status) {
    case 'attended':
      return 'success';
    case 'confirmed':
      return 'info';
    case 'no-show':
      return 'error';
    case 'cancelled':
      return 'default';
    default:
      return 'warning';
  }
};

const sortReservationsForService = (items: Reservation[], nowTimestamp: number) =>
  [...items].sort((left, right) => {
    const leftTimestamp = new Date(left.reservation_at).getTime();
    const rightTimestamp = new Date(right.reservation_at).getTime();
    const leftClosed =
      leftTimestamp < nowTimestamp ||
      ['no-show', 'cancelled'].includes(left.status) ||
      left.presence_confirmed;
    const rightClosed =
      rightTimestamp < nowTimestamp ||
      ['no-show', 'cancelled'].includes(right.status) ||
      right.presence_confirmed;

    if (leftClosed === rightClosed) {
      return leftClosed ? rightTimestamp - leftTimestamp : leftTimestamp - rightTimestamp;
    }

    return leftClosed ? 1 : -1;
  });

const downloadReservationsCsv = (rows: Reservation[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const escapeCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const header = ['Fecha', 'Hora', 'Cliente', 'Email', 'Comensales', 'Estado'];
  const dataRows = rows.map((reservation) => {
    const reservationDate = new Date(reservation.reservation_at);
    return [
      format(reservationDate, 'yyyy-MM-dd'),
      format(reservationDate, 'HH:mm'),
      reservation.user_name,
      reservation.user_email,
      reservation.requested_guests,
      getStatusLabel(reservation)
    ];
  });

  const csvContent = [header, ...dataRows]
    .map((row) => row.map((value) => escapeCell(value)).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `reservas-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

const getActionWindowLabel = (reservation: Reservation, currentTime: Date) => {
  const derivedStatus = getDerivedStatus(reservation);
  const reservationTime = new Date(reservation.reservation_at);
  const noShowTime = new Date(reservationTime.getTime() + NO_SHOW_DELAY_MS);

  if (derivedStatus === 'attended') {
    return 'Asistencia confirmada';
  }

  if (derivedStatus === 'no-show') {
    return 'Marcada como no show';
  }

  if (derivedStatus === 'cancelled') {
    return 'Reserva cancelada';
  }

  if (derivedStatus === 'confirmed') {
    return 'Reserva confirmada';
  }

  if (currentTime < reservationTime) {
    return `Asistencia desde ${format(reservationTime, 'HH:mm')} | No show desde ${format(
      noShowTime,
      'HH:mm'
    )}`;
  }

  if (currentTime < noShowTime) {
    return `No show disponible desde ${format(noShowTime, 'HH:mm')}`;
  }

  return 'Lista para cerrar como asistencia o no show';
};

const getEmptyStateText = (scope: ReservationScope, statusFilter: ReservationStatusFilter) => {
  if (scope !== 'all' || statusFilter !== 'all') {
    return 'No hay reservas para los filtros seleccionados.';
  }

  return 'No hay reservas para este restaurante todavia.';
};

const RestaurantDashboard: React.FC = () => {
  const { restaurant } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [highlightedReservationId, setHighlightedReservationId] = useState<number | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [confirmAction, setConfirmAction] = useState<'attend' | 'no-show' | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scope, setScope] = useState<ReservationScope>('today');
  const [statusFilter, setStatusFilter] = useState<ReservationStatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReservations = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(withBase('/api/restaurants/reservations'), {
        headers: withAuthHeader(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar las reservas del restaurante.');
      }

      const data = (await response.json()) as Reservation[];
      setReservations(data);
    } catch (error) {
      setNotification({
        open: true,
        message: (error as Error).message || 'Error al cargar las reservas.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
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
      navigate('/restaurant/login', { replace: true });
      return;
    }

    void fetchReservations();

    if (restaurant.restaurant_id) {
      socket.emit('join_restaurant_room', restaurant.restaurant_id);
    }

    const handleNewReservation = (data: { reservation: Reservation }) => {
      setReservations((current) => [data.reservation, ...current]);
      setHighlightedReservationId(data.reservation.id);
      setNotification({
        open: true,
        message: `Nueva reserva de ${data.reservation.user_name} para ${data.reservation.requested_guests} persona(s).`,
        severity: 'success'
      });

      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    };

    const handleReservationUpdated = (data: {
      reservation_id: number;
      presence_confirmed: boolean;
      status: string;
    }) => {
      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === data.reservation_id
            ? {
                ...reservation,
                presence_confirmed: data.presence_confirmed,
                presence_confirmed_at: data.presence_confirmed
                  ? new Date().toISOString()
                  : null,
                status: data.status
              }
            : reservation
        )
      );

      setNotification({
        open: true,
        message: `La reserva #${data.reservation_id} cambio a ${data.status}.`,
        severity: 'info'
      });
    };

    socket.on('new_reservation', handleNewReservation);
    socket.on('reservation_updated', handleReservationUpdated);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('new_reservation', handleNewReservation);
      socket.off('reservation_updated', handleReservationUpdated);
    };
  }, [navigate, restaurant, socket]);

  useEffect(() => {
    if (highlightedReservationId === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedReservationId(null);
    }, 6000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [highlightedReservationId]);

  const sortedReservations = useMemo(
    () => sortReservationsForService(reservations, currentTime.getTime()),
    [currentTime, reservations]
  );

  const metrics = useMemo(() => {
    const nowTimestamp = currentTime.getTime();
    const todayReservations = reservations.filter((reservation) =>
      isSameServiceDay(new Date(reservation.reservation_at), currentTime)
    );
    const todayCovers = todayReservations
      .filter((reservation) => reservation.status !== 'cancelled')
      .reduce((total, reservation) => total + reservation.requested_guests, 0);
    const pendingCount = reservations.filter((reservation) => reservation.status === 'pending').length;
    const upcomingCount = reservations.filter(
      (reservation) =>
        new Date(reservation.reservation_at).getTime() >= nowTimestamp &&
        !['cancelled', 'no-show'].includes(reservation.status)
    ).length;
    const followUpCount = reservations.filter((reservation) => {
      const reservationTimestamp = new Date(reservation.reservation_at).getTime();
      return (
        reservation.status === 'no-show' ||
        (reservation.status === 'pending' && reservationTimestamp + NO_SHOW_DELAY_MS < nowTimestamp)
      );
    }).length;

    return {
      todayReservations: todayReservations.length,
      todayCovers,
      pendingCount,
      upcomingCount,
      followUpCount
    };
  }, [currentTime, reservations]);

  const visibleReservations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const nowTimestamp = currentTime.getTime();

    return sortedReservations.filter((reservation) => {
      const reservationDate = new Date(reservation.reservation_at);
      const reservationTimestamp = reservationDate.getTime();
      const derivedStatus = getDerivedStatus(reservation);
      const matchesSearch =
        normalizedSearch === '' ||
        reservation.user_name.toLowerCase().includes(normalizedSearch) ||
        reservation.user_email.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      if (statusFilter !== 'all' && derivedStatus !== statusFilter) {
        return false;
      }

      if (scope === 'today') {
        return isSameServiceDay(reservationDate, currentTime);
      }

      if (scope === 'upcoming') {
        return reservationTimestamp >= nowTimestamp && !['cancelled', 'no-show'].includes(reservation.status);
      }

      if (scope === 'history') {
        return (
          reservationTimestamp < nowTimestamp ||
          ['cancelled', 'no-show'].includes(reservation.status) ||
          reservation.presence_confirmed
        );
      }

      return true;
    });
  }, [currentTime, scope, searchTerm, sortedReservations, statusFilter]);

  const handleOpenConfirmDialog = (
    reservation: Reservation,
    action: 'attend' | 'no-show'
  ) => {
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
    if (!selectedReservation || confirmAction === null) {
      return;
    }

    const present = confirmAction === 'attend';
    const originalReservation = selectedReservation;

    handleCloseConfirmDialog();
    setReservations((current) =>
      current.map((reservation) =>
        reservation.id === originalReservation.id
          ? {
              ...reservation,
              presence_confirmed: present,
              presence_confirmed_at: present ? new Date().toISOString() : null,
              status: present ? 'confirmed' : 'no-show'
            }
          : reservation
      )
    );

    try {
      const response = await fetch(
        withBase(`/api/restaurants/reservations/${originalReservation.id}/confirm-presence`),
        {
          method: 'PATCH',
          headers: withAuthHeader({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify({ present })
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo actualizar el estado de la reserva.');
      }

      setNotification({
        open: true,
        message: present
          ? 'La reserva quedo marcada como asistencia.'
          : 'La reserva quedo marcada como no show.',
        severity: 'success'
      });
    } catch (error) {
      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === originalReservation.id ? originalReservation : reservation
        )
      );
      setNotification({
        open: true,
        message: (error as Error).message || 'Error al actualizar la reserva.',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification((current) => ({ ...current, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const summaryCards = [
    {
      title: 'Servicio hoy',
      value: metrics.todayReservations,
      subtitle: 'reservas del dia',
      icon: <TodayOutlinedIcon color="primary" />
    },
    {
      title: 'Cubiertos hoy',
      value: metrics.todayCovers,
      subtitle: 'comensales confirmados y pendientes',
      icon: <GroupsOutlinedIcon color="secondary" />
    },
    {
      title: 'Pendientes',
      value: metrics.pendingCount,
      subtitle: 'reservas por cerrar',
      icon: <PendingActionsOutlinedIcon sx={{ color: '#b45309' }} />
    },
    {
      title: 'Proximas',
      value: metrics.upcomingCount,
      subtitle: 'servicios por venir',
      icon: <EventAvailableOutlinedIcon sx={{ color: '#2563eb' }} />
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ xs: 'flex-start', lg: 'center' }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main' }}>
              Panel operativo
            </Typography>
            <Typography variant="h4" sx={{ mb: 0.5 }}>
              {restaurant?.name || 'Restaurante'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona reservas, confirma asistencia y sigue el ritmo del servicio en tiempo real.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Badge color={socketConnected ? 'success' : 'error'} variant="dot">
              <Chip
                label={socketConnected ? 'Socket conectado' : 'Socket desconectado'}
                variant="outlined"
              />
            </Badge>
            <Button
              variant="outlined"
              startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={() => void fetchReservations(true)}
              disabled={isRefreshing}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadOutlinedIcon />}
              disabled={visibleReservations.length === 0}
              onClick={() => downloadReservationsCsv(visibleReservations)}
            >
              Exportar CSV
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          {summaryCards.map((card) => (
            <Paper
              key={card.title}
              variant="outlined"
              sx={{ p: 2.25, borderRadius: 3, flex: 1, minWidth: 0 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    backgroundColor: 'rgba(255, 115, 79, 0.1)'
                  }}
                >
                  {card.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    {card.title}
                  </Typography>
                  <Typography variant="h5">{card.value}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.subtitle}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>

        {metrics.followUpCount > 0 && (
          <Alert severity="warning" icon={<WarningAmberOutlinedIcon />}>
            Hay {metrics.followUpCount} reserva(s) que merecen seguimiento rapido.
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'center' }}
            >
              <TextField
                label="Buscar cliente o email"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                size="small"
                sx={{ minWidth: 280, flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {visibleReservations.length} reserva(s) visibles
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Ventana de servicio
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {scopeOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    clickable
                    color={scope === option.value ? 'primary' : 'default'}
                    onClick={() => setScope(option.value)}
                  />
                ))}
              </Stack>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Estado
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {statusOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    clickable
                    color={statusFilter === option.value ? 'secondary' : 'default'}
                    onClick={() => setStatusFilter(option.value)}
                  />
                ))}
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha y hora</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Comensales</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Ventana de accion</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Stack spacing={1} alignItems="center">
                      <Typography variant="subtitle1">
                        {getEmptyStateText(scope, statusFilter)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ajusta la busqueda o cambia la ventana de servicio para ver mas resultados.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                visibleReservations.map((reservation) => {
                  const reservationTime = new Date(reservation.reservation_at);
                  const noShowTime = new Date(reservationTime.getTime() + NO_SHOW_DELAY_MS);
                  const derivedStatus = getDerivedStatus(reservation);
                  const isAssistButtonEnabled = currentTime >= reservationTime;
                  const isNoShowButtonEnabled = currentTime >= noShowTime;
                  const isButtonBlocked = ['confirmed', 'no-show', 'cancelled'].includes(
                    reservation.status
                  );
                  const needsAttention =
                    reservation.status === 'pending' &&
                    currentTime.getTime() >= noShowTime.getTime();

                  return (
                    <TableRow
                      key={reservation.id}
                      sx={{
                        backgroundColor:
                          highlightedReservationId === reservation.id
                            ? 'rgba(56, 142, 60, 0.08)'
                            : needsAttention
                              ? 'rgba(237, 108, 2, 0.06)'
                              : 'inherit'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {format(reservationTime, "EEE d 'de' MMM", { locale: es })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(reservationTime, 'HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {reservation.user_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {reservation.user_email}
                        </Typography>
                      </TableCell>
                      <TableCell>{reservation.requested_guests}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(reservation)}
                          color={getStatusColor(derivedStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getActionWindowLabel(reservation, currentTime)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <ButtonGroup variant="outlined" size="small">
                          <Button
                            color="success"
                            onClick={() => handleOpenConfirmDialog(reservation, 'attend')}
                            disabled={!isAssistButtonEnabled || isButtonBlocked}
                            sx={{
                              opacity: isAssistButtonEnabled && !isButtonBlocked ? 1 : 0.5
                            }}
                          >
                            Asistio
                          </Button>
                          <Button
                            color="error"
                            onClick={() => handleOpenConfirmDialog(reservation, 'no-show')}
                            disabled={!isNoShowButtonEnabled || isButtonBlocked}
                            sx={{
                              opacity: isNoShowButtonEnabled && !isButtonBlocked ? 1 : 0.5
                            }}
                          >
                            No show
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
      </Stack>

      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirmar accion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'attend'
              ? 'La reserva quedara marcada como asistencia confirmada.'
              : 'La reserva quedara marcada como no show.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
          <Button
            onClick={handleUpdatePresenceStatus}
            autoFocus
            color={confirmAction === 'attend' ? 'success' : 'error'}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RestaurantDashboard;
