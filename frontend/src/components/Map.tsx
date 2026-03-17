/// <reference types="vite/client" />

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HistoryIcon from '@mui/icons-material/History';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format as formatDateFns } from 'date-fns';
import ReserveCard from './ReserveCard';
import { User } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import {
  focusRestaurantOnMap,
  RESTAURANT_FOCUS_EVENT,
  useRestaurantPreferences
} from '../hooks/useRestaurantPreferences';
import { API_BASE_URL, GMAPS_KEY } from '../config/env';
import { withAuthHeader } from '../config/authToken';

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export interface Restaurant {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  description: string;
  seats_total: number;
  tables_total?: number;
  phone?: string;
  email?: string;
  address?: string;
  tags?: string[];
  neighborhood?: string;
}

interface Availability {
  start: number;
  available_tables: number;
}

interface MapProps {
  user: User;
}

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
const MONTEVIDEO_OFFSET_MS = -3 * 60 * 60 * 1000;

const withBase = (path: string) => new URL(path, API_BASE_URL).toString();

const requestConfig = (headers: Record<string, string> = {}) => ({
  headers: withAuthHeader(headers),
  withCredentials: true
});

const generateTimeSlots = () => {
  const slots: string[] = [];

  for (let hour = 10; hour <= 23; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 23 && minute > 30) {
        continue;
      }

      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }

  return slots;
};

const restaurantMatchesFilters = (
  restaurant: Restaurant,
  selectedValues: string[],
  allTags: string[],
  allNeighborhoods: string[]
) => {
  const selectedTags = selectedValues.filter((value) => allTags.includes(value));
  const selectedNeighborhoods = selectedValues.filter((value) =>
    allNeighborhoods.includes(value)
  );

  const hasAllSelectedTags = selectedTags.every((tag) => restaurant.tags?.includes(tag));
  const matchesNeighborhood =
    selectedNeighborhoods.length === 0 ||
    selectedNeighborhoods.includes(restaurant.neighborhood || '');

  return hasAllSelectedTags && matchesNeighborhood;
};

const formatAvailabilityTimestamp = (timestamp: number) => {
  const localDate = new Date(timestamp - MONTEVIDEO_OFFSET_MS);
  const hours = String(localDate.getUTCHours()).padStart(2, '0');
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function Map({ user }: MapProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GMAPS_KEY
  });

  const socket = useSocket();
  const { favorites, recentViews, isFavorite, toggleFavorite, addRecentView } =
    useRestaurantPreferences();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [date, setDate] = useState('');
  const [selectedInterval, setSelectedInterval] = useState('');
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState<{
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);
  const [center, setCenter] = useState({ lat: -34.9011, lng: -56.1645 });
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filterAvailabilityDate, setFilterAvailabilityDate] = useState<Date | null>(new Date());
  const [filterAvailabilityTime, setFilterAvailabilityTime] = useState('');
  const [filterAvailabilityGuests, setFilterAvailabilityGuests] = useState(2);
  const [filterAvailabilityTags, setFilterAvailabilityTags] = useState<string[]>([]);
  const [availabilityFilterActive, setAvailabilityFilterActive] = useState(false);
  const [restaurantsMatchingAvailability, setRestaurantsMatchingAvailability] = useState<
    Restaurant[]
  >([]);
  const [availabilitySearchMessage, setAvailabilitySearchMessage] = useState('');
  const [availabilityFilterAnchorEl, setAvailabilityFilterAnchorEl] =
    useState<HTMLElement | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState('');
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSearchingAvailability, setIsSearchingAvailability] = useState(false);
  const [isLoadingSelection, setIsLoadingSelection] = useState(false);
  const [mapAuthError, setMapAuthError] = useState('');

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const allTags = useMemo(
    () => Array.from(new Set(restaurants.flatMap((restaurant) => restaurant.tags || []))).sort(),
    [restaurants]
  );
  const allNeighborhoods = useMemo(
    () =>
      Array.from(
        new Set(
          restaurants
            .map((restaurant) => restaurant.neighborhood)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [restaurants]
  );
  const allCategoryOptions = useMemo(
    () => Array.from(new Set([...allTags, ...allNeighborhoods])).sort(),
    [allNeighborhoods, allTags]
  );
  const favoriteIds = useMemo(() => new Set(favorites.map((favorite) => favorite.id)), [favorites]);

  const baseRestaurantList = availabilityFilterActive
    ? restaurantsMatchingAvailability
    : restaurants;

  const visibleRestaurants = useMemo(
    () =>
      baseRestaurantList.filter((restaurant) => {
        const matchesText =
          searchText.trim() === '' ||
          restaurant.name.toLowerCase().includes(searchText.trim().toLowerCase());

        return (
          matchesText &&
          (!favoritesOnly || favoriteIds.has(restaurant.id)) &&
          restaurantMatchesFilters(restaurant, selectedCategories, allTags, allNeighborhoods)
        );
      }),
    [
      allNeighborhoods,
      allTags,
      baseRestaurantList,
      favoriteIds,
      favoritesOnly,
      searchText,
      selectedCategories
    ]
  );

  const fetchRestaurants = async () => {
    setIsLoadingRestaurants(true);
    setRestaurantsError('');

    try {
      const response = await axios.get<Restaurant[]>(
        withBase('/api/restaurants'),
        requestConfig()
      );
      setRestaurants(response.data);
    } catch (error: any) {
      setRestaurantsError(
        error.response?.data?.error || 'No se pudieron cargar los restaurantes.'
      );
    } finally {
      setIsLoadingRestaurants(false);
    }
  };

  const fetchAvailability = async (restaurantId: number, nextDate: string) => {
    setIsLoadingAvailability(true);
    setMessage('');

    try {
      const url = new URL(`/api/restaurants/${restaurantId}/availability`, API_BASE_URL);
      url.searchParams.set('date', nextDate);

      const response = await axios.get<Availability[]>(url.toString(), requestConfig());
      setAvailability(response.data);
      setSelectedInterval((current) => {
        if (current && response.data.some((slot) => String(slot.start) === current)) {
          return current;
        }

        return response.data[0] ? String(response.data[0].start) : '';
      });
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability([]);
      setSelectedInterval('');
      setMessage('No se pudo cargar la disponibilidad para este restaurante.');
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchRestaurants();
    }
  }, [user]);

  useEffect(() => {
    window.gm_authFailure = () => {
      setMapAuthError(
        'Google Maps rechazo la API key. Verifica que la clave pertenezca a un proyecto activo y que la Maps JavaScript API este habilitada.'
      );
    };

    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  useEffect(() => {
    if (!selected || !date) {
      setAvailability([]);
      setSelectedInterval('');
      return;
    }

    void fetchAvailability(selected.id, date);
  }, [date, selected]);

  useEffect(() => {
    const handleReservationCancelled = () => {
      setNotification({
        message: 'Reserva cancelada exitosamente',
        severity: 'info'
      });
    };

    window.addEventListener('reservation-cancelled', handleReservationCancelled);
    return () => {
      window.removeEventListener('reservation-cancelled', handleReservationCancelled);
    };
  }, []);

  useEffect(() => {
    const handleOccupancyUpdate = ({ restaurant_id }: { restaurant_id: number }) => {
      if (selected?.id === restaurant_id && date) {
        void fetchAvailability(restaurant_id, date);
      }
    };

    socket.on('occupancy_update', handleOccupancyUpdate);
    return () => {
      socket.off('occupancy_update', handleOccupancyUpdate);
    };
  }, [date, selected, socket]);

  const handleMarkerClick = async (restaurant: Restaurant) => {
    setIsLoadingSelection(true);
    setMessage('');
    setNotification(null);

    try {
      const response = await axios.get<Restaurant>(
        withBase(`/api/restaurants/${restaurant.id}`),
        requestConfig()
      );
      setSelected(response.data);
      setGuests(1);
      setDate('');
      setAvailability([]);
      setSelectedInterval('');
      setCenter({
        lat: Number(response.data.latitude),
        lng: Number(response.data.longitude)
      });
      addRecentView(response.data);
    } catch (error: any) {
      setNotification({
        message:
          error.response?.data?.error || 'No se pudo cargar el detalle del restaurante.',
        severity: 'error'
      });
    } finally {
      setIsLoadingSelection(false);
    }
  };

  useEffect(() => {
    const handleFocusRestaurant = (event: Event) => {
      const customEvent = event as CustomEvent<{ restaurantId?: number }>;
      const restaurantId = customEvent.detail?.restaurantId;
      if (!restaurantId) {
        return;
      }

      const restaurant = restaurants.find((item) => item.id === restaurantId);
      if (restaurant) {
        void handleMarkerClick(restaurant);
      }
    };

    window.addEventListener(RESTAURANT_FOCUS_EVENT, handleFocusRestaurant as EventListener);
    return () => {
      window.removeEventListener(RESTAURANT_FOCUS_EVENT, handleFocusRestaurant as EventListener);
    };
  }, [restaurants]);

  const handleReserve = async () => {
    setMessage('');
    setNotification(null);

    try {
      const response = await axios.post(
        withBase('/api/reservations'),
        {
          restaurant_id: selected?.id,
          reservation_at: Number(selectedInterval),
          guests
        },
        requestConfig()
      );

      const newReservation = response.data.reservation;
      const displayGuests = newReservation?.requested_guests || guests;

      setNotification({
        message: `Reserva para ${displayGuests} persona(s) confirmada`,
        severity: 'success'
      });
      window.dispatchEvent(new Event('reservation-made'));
      setSelected(null);
    } catch (error: any) {
      const serverMessage = error.response?.data?.error as string | undefined;
      setNotification({
        message: serverMessage || 'Error al reservar',
        severity: 'error'
      });

      if (
        serverMessage &&
        (serverMessage.includes('Not enough tables') ||
          serverMessage.includes('No hay suficientes mesas'))
      ) {
        setMessage('No hay mesas disponibles en ese horario. Elige otro horario.');
      }

      if (selected && date) {
        void fetchAvailability(selected.id, date);
      }
    }
  };

  const handleOpenAvailabilityPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAvailabilityFilterAnchorEl(event.currentTarget);
  };

  const handleCloseAvailabilityPopover = () => {
    setAvailabilityFilterAnchorEl(null);
  };

  const resetAvailabilityPopoverInputs = () => {
    setFilterAvailabilityDate(new Date());
    setFilterAvailabilityTime('');
    setFilterAvailabilityGuests(2);
    setFilterAvailabilityTags([]);
  };

  const clearAvailabilityFilter = () => {
    setAvailabilityFilterActive(false);
    setRestaurantsMatchingAvailability([]);
    setAvailabilitySearchMessage('');
    resetAvailabilityPopoverInputs();
    handleCloseAvailabilityPopover();
  };

  const handleSearchByAvailability = async () => {
    if (!filterAvailabilityDate || !filterAvailabilityTime || filterAvailabilityGuests <= 0) {
      setAvailabilitySearchMessage(
        'Selecciona una fecha, una hora y una cantidad valida de comensales.'
      );
      return;
    }

    setIsSearchingAvailability(true);
    setAvailabilityFilterActive(true);
    setRestaurantsMatchingAvailability([]);
    setAvailabilitySearchMessage('');

    const formattedDateForApi = formatDateFns(filterAvailabilityDate, 'yyyy-MM-dd');
    const [hour, minute] = filterAvailabilityTime.split(':').map(Number);
    const localTimeAsTimestamp = Date.UTC(
      filterAvailabilityDate.getFullYear(),
      filterAvailabilityDate.getMonth(),
      filterAvailabilityDate.getDate(),
      hour,
      minute,
      0
    );
    const targetSlotUtcTimestamp = localTimeAsTimestamp - MONTEVIDEO_OFFSET_MS;
    const neededTables = Math.ceil(filterAvailabilityGuests / 2);

    const promises = restaurants.map(async (restaurant) => {
      try {
        const url = new URL(`/api/restaurants/${restaurant.id}/availability`, API_BASE_URL);
        url.searchParams.set('date', formattedDateForApi);

        const response = await axios.get<Availability[]>(url.toString(), requestConfig());
        const matchingSlot = response.data.find(
          (slot) => slot.start === targetSlotUtcTimestamp && slot.available_tables >= neededTables
        );

        return matchingSlot ? restaurant : null;
      } catch {
        return null;
      }
    });

    try {
      const foundRestaurants = (await Promise.all(promises)).filter(
        (restaurant): restaurant is Restaurant => restaurant !== null
      );

      const filteredRestaurants = foundRestaurants.filter((restaurant) =>
        restaurantMatchesFilters(
          restaurant,
          filterAvailabilityTags,
          allTags,
          allNeighborhoods
        )
      );

      setRestaurantsMatchingAvailability(filteredRestaurants);
      if (filteredRestaurants.length === 0) {
        setAvailabilitySearchMessage(
          'No se encontraron restaurantes con disponibilidad para esos criterios.'
        );
      } else {
        setAvailabilitySearchMessage(
          `${filteredRestaurants.length} restaurante(s) encontrado(s) con disponibilidad.`
        );
        setCenter({
          lat: Number(filteredRestaurants[0].latitude),
          lng: Number(filteredRestaurants[0].longitude)
        });
      }
    } catch (error) {
      console.error('Error processing availability search:', error);
      setAvailabilitySearchMessage('Ocurrio un error al buscar disponibilidad.');
    } finally {
      setIsSearchingAvailability(false);
      handleCloseAvailabilityPopover();
    }
  };

  if (!GMAPS_KEY) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">
          Falta configurar <code>VITE_GMAPS_KEY</code> para mostrar el mapa.
        </Alert>
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">No se pudo cargar Google Maps.</Alert>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 2,
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          flexShrink: 0
        }}
      >
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: 'column', xl: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', xl: 'center' }}
          >
            <TextField
              label="Buscar restaurante"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              size="small"
              sx={{ minWidth: 220, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

            <Autocomplete
              multiple
              options={allCategoryOptions}
              value={selectedCategories}
              disableCloseOnSelect
              size="small"
              onChange={(_event, newValue) => setSelectedCategories(newValue)}
              renderOption={(props, option, { selected: optionSelected }) => {
                const { key, ...optionProps } = props;

                return (
                <li key={key} {...optionProps}>
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    checked={optionSelected}
                    sx={{ mr: 1 }}
                  />
                  {option}
                </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categorias y barrios"
                  placeholder={selectedCategories.length === 0 ? 'Filtrar resultados' : ''}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <FilterListIcon />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
              sx={{ minWidth: 260, flex: 1.4 }}
            />

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant={favoritesOnly ? 'contained' : 'outlined'}
                color={favoritesOnly ? 'secondary' : 'inherit'}
                startIcon={favoritesOnly ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={() => setFavoritesOnly((current) => !current)}
              >
                Favoritos
              </Button>
              <Button
                variant="outlined"
                onClick={handleOpenAvailabilityPopover}
                startIcon={<FilterListIcon />}
              >
                Disponibilidad
              </Button>
              {availabilityFilterActive && (
                <Button variant="text" color="secondary" onClick={clearAvailabilityFilter}>
                  Limpiar filtro
                </Button>
              )}
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<RoomOutlinedIcon />}
                label={`${visibleRestaurants.length} visibles`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<ExploreOutlinedIcon />}
                label={`${restaurants.length} totales`}
                variant="outlined"
              />
              <Chip
                icon={<FavoriteIcon />}
                label={`${favorites.length} guardados`}
                variant="outlined"
              />
            </Stack>

            {availabilitySearchMessage && (
              <Typography variant="body2" color="text.secondary">
                {availabilitySearchMessage}
              </Typography>
            )}
          </Stack>

          {recentViews.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip icon={<HistoryIcon />} label="Vistos recientemente" variant="outlined" />
              {recentViews.slice(0, 4).map((restaurant) => (
                <Chip
                  key={restaurant.id}
                  label={restaurant.name}
                  clickable
                  onClick={() => focusRestaurantOnMap(restaurant.id)}
                />
              ))}
            </Stack>
          )}

          {restaurantsError && <Alert severity="error">{restaurantsError}</Alert>}
          {mapAuthError && <Alert severity="error">{mapAuthError}</Alert>}
        </Stack>

        <Popover
          open={Boolean(availabilityFilterAnchorEl)}
          anchorEl={availabilityFilterAnchorEl}
          onClose={handleCloseAvailabilityPopover}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              minWidth: 340,
              maxWidth: 400
            }}
          >
            <Typography variant="subtitle1">Filtrar por disponibilidad</Typography>
            <DatePicker
              label="Fecha"
              value={filterAvailabilityDate}
              onChange={(newValue: Date | null) => setFilterAvailabilityDate(newValue)}
              minDate={new Date()}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="filter-time-popover-label">Hora</InputLabel>
              <Select
                labelId="filter-time-popover-label"
                value={filterAvailabilityTime}
                label="Hora"
                onChange={(event: SelectChangeEvent<string>) =>
                  setFilterAvailabilityTime(event.target.value)
                }
              >
                {timeSlots.map((slot) => (
                  <MenuItem key={slot} value={slot}>
                    {slot}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Comensales"
              type="number"
              size="small"
              fullWidth
              value={filterAvailabilityGuests}
              onChange={(event) =>
                setFilterAvailabilityGuests(Math.max(1, parseInt(event.target.value, 10) || 1))
              }
              inputProps={{ min: 1 }}
            />
            <Autocomplete
              multiple
              options={allCategoryOptions}
              value={filterAvailabilityTags}
              disableCloseOnSelect
              size="small"
              onChange={(_event, newValue) => setFilterAvailabilityTags(newValue)}
              renderOption={(props, option, { selected: optionSelected }) => {
                const { key, ...optionProps } = props;

                return (
                <li key={key} {...optionProps}>
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    checked={optionSelected}
                    sx={{ mr: 1 }}
                  />
                  {option}
                </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categorias o barrio"
                  placeholder={filterAvailabilityTags.length === 0 ? 'Opcional' : ''}
                />
              )}
            />
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Button variant="text" onClick={resetAvailabilityPopoverInputs}>
                Limpiar campos
              </Button>
              <Button
                variant="contained"
                onClick={() => void handleSearchByAvailability()}
                disabled={isSearchingAvailability}
              >
                {isSearchingAvailability ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Buscar'
                )}
              </Button>
            </Stack>
          </Box>
        </Popover>
      </Box>

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        {(notification || isLoadingSelection || (isLoadingRestaurants && !restaurantsError)) && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
              width: 'min(90%, 520px)'
            }}
          >
            <Stack spacing={1}>
              {notification && (
                <Alert
                  severity={notification.severity}
                  onClose={() => setNotification(null)}
                  sx={{ boxShadow: 3 }}
                >
                  {notification.message}
                </Alert>
              )}
              {isLoadingSelection && (
                <Alert severity="info" icon={<CircularProgress size={18} />}>
                  Cargando detalle del restaurante...
                </Alert>
              )}
              {isLoadingRestaurants && !restaurantsError && (
                <Alert severity="info" icon={<CircularProgress size={18} />}>
                  Actualizando restaurantes...
                </Alert>
              )}
            </Stack>
          </Box>
        )}

        <GoogleMap
          center={center}
          zoom={12}
          mapContainerStyle={{ height: '100%', width: '100%' }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {visibleRestaurants.map((restaurant) => (
            <MarkerF
              key={restaurant.id}
              position={{
                lat: Number(restaurant.latitude),
                lng: Number(restaurant.longitude)
              }}
              title={`${restaurant.name} (${restaurant.seats_total / 2} mesas)`}
              onClick={() => void handleMarkerClick(restaurant)}
              icon={{
                fillColor: '#ff734f',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeOpacity: 1,
                strokeWeight: 2,
                path: google.maps.SymbolPath.CIRCLE,
                scale: 7
              }}
            />
          ))}
        </GoogleMap>
      </Box>

      {selected && (
        <ReserveCard
          selected={selected}
          availability={availability}
          selectedInterval={selectedInterval}
          setSelectedInterval={setSelectedInterval}
          date={date}
          setDate={setDate}
          guests={guests}
          setGuests={setGuests}
          handleReserve={handleReserve}
          setSelected={setSelected}
          message={message}
          isLoadingAvailability={isLoadingAvailability}
          formatAvailabilityTimestamp={formatAvailabilityTimestamp}
          isFavorite={isFavorite(selected.id)}
          onToggleFavorite={() => toggleFavorite(selected)}
        />
      )}
    </Box>
  );
}
