/// <reference types="vite/client" />

import React, { useEffect, useState } from 'react';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import axios from 'axios';
import { User } from '../hooks/useAuth';
import ReserveCard from './ReserveCard';
import { useSocket } from '../hooks/useSocket';

// Material-UI imports
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Popover from '@mui/material/Popover'; // Added Popover
import Typography from '@mui/material/Typography'; // Optional: for titles in Popover
import CheckIcon from '@mui/icons-material/Check';

// Add these imports
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale'; // Importar el locale español
import { format as formatDateFns } from 'date-fns'; // Importar format y renombrarlo

import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert'; // Asegúrate que Alert está importado

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
}

interface MapProps {
  user: User;
}

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export default function Map({ user }: MapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GMAPS_KEY as string
  });

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [guests, setGuests] = useState(1); // For ReserveCard
  const [date, setDate] = useState(''); // For ReserveCard
  const [availability, setAvailability] = useState<{ start: number; available_tables: number }[]>([]); // For ReserveCard
  const [selectedInterval, setSelectedInterval] = useState(''); // For ReserveCard
  const [message, setMessage] = useState(''); // For ReserveCard
  // Eliminar el estado snackbar
  // const [snackbar, setSnackbar] = useState({
  //   open: false,
  //   message: '',
  //   severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  // });
  const [persistentNotification, setPersistentNotification] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const socket = useSocket();
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: -34.9011, lng: -56.1645 });
  
  const [searchText, setSearchText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // State for availability filter
  const [filterAvailabilityDate, setFilterAvailabilityDate] = useState<Date | null>(new Date());
  const [filterAvailabilityTime, setFilterAvailabilityTime] = useState<string>(''); // e.g., "10:00"
  const [filterAvailabilityGuests, setFilterAvailabilityGuests] = useState<number>(2);
  const [filterAvailabilityTags, setFilterAvailabilityTags] = useState<string[]>([]); // New state for tags in availability filter
  const [availabilityFilterActive, setAvailabilityFilterActive] = useState<boolean>(false);
  const [restaurantsMatchingAvailability, setRestaurantsMatchingAvailability] = useState<Restaurant[]>([]);
  const [isSearchingAvailability, setIsSearchingAvailability] = useState<boolean>(false);
  const [availabilitySearchMessage, setAvailabilitySearchMessage] = useState<string>('');

  // Reserva confirmada message
  const [reservaConfirmadaMessage, setReservaConfirmadaMessage] = useState<string>('');

  // State for Popover
  const [availabilityFilterAnchorEl, setAvailabilityFilterAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const handleReservationCancelled = () => {
      setPersistentNotification({
        message: 'Reserva cancelada exitosamente',
        severity: 'info'
      });
      setTimeout(() => {
        setPersistentNotification(null);
      }, 3000);
    };

    window.addEventListener('reservation-cancelled', handleReservationCancelled);

    return () => {
      window.removeEventListener('reservation-cancelled', handleReservationCancelled);
    };
  }, []);

  const handleOpenAvailabilityPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAvailabilityFilterAnchorEl(event.currentTarget);
  };

  const handleCloseAvailabilityPopover = () => {
    setAvailabilityFilterAnchorEl(null);
  };


  const allCategories = Array.from(
    new Set(restaurants.flatMap(r => r.tags || []))
  ).sort();

  const filteredRestaurants = restaurants.filter(r =>
    selectedCategories.length === 0 ||
    (r.tags && selectedCategories.every(category => r.tags!.includes(category)))
  );

  // Generate time slots (10:00 to 23:30, every 15 mins)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const openHour = 10;
    const closeHour = 23; // Restaurant allows reservations up to 23:30
    for (let h = openHour; h <= closeHour; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === closeHour && m > 30) continue; 
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (user) {
      axios.get('/api/restaurants').then((res) => setRestaurants(res.data));
    }
  }, [user]);

  useEffect(() => {
    console.log('Map: Setting up occupancy_update listener');
    const handleOccupancyUpdate = ({ restaurant_id }: { restaurant_id: number }) => {
      console.log(`Map: Occupancy update received for restaurant ${restaurant_id}`);
      setRestaurants(prev => prev.map(r => r.id === restaurant_id ? { ...r } : r)); 
    };

    socket.on('occupancy_update', handleOccupancyUpdate);

    return () => {
      console.log('Map: Cleaning up occupancy_update listener');
      socket.off('occupancy_update', handleOccupancyUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (selected && date) {
      axios
        .get<{ start: number; available_tables: number }[]>(
          `/api/restaurants/${selected.id}/availability?date=${date}`,
          { withCredentials: true }
        )
        .then((res) => {
          setAvailability(res.data);
          if (res.data && res.data.length > 0) {
            setSelectedInterval(res.data[0].start.toString());
          } else {
            setSelectedInterval('');
          }
        })
        .catch(err => {
          console.error("Error fetching availability for ReserveCard:", err);
          setAvailability([]);
          setSelectedInterval('');
        });
    } else {
      setAvailability([]);
      setSelectedInterval('');
    }
  }, [selected, date]);

  const handleMarkerClick = async (r: Restaurant) => {
    const res = await axios.get(`/api/restaurants/${r.id}`);
    setSelected(res.data);
    setGuests(1);
    setDate('');
    setAvailability([]);
    setSelectedInterval('');
    setMessage(''); 
    // Do not clear availabilitySearchMessage here, it's global for the filter
    setCenter({ lat: Number(r.latitude), lng: Number(r.longitude) });
  };

  const handleReserve = async () => {
    setMessage('');
    setPersistentNotification(null); // Limpiar notificaciones previas
    try {
      const res = await axios.post(
        '/api/reservations',
        {
          restaurant_id: selected?.id,
          reservation_at: Number(selectedInterval),
          guests
        },
        { withCredentials: true }
      );
      const newReservation = res.data.reservation;
      const displayGuests = newReservation?.requested_guests || guests;

      setPersistentNotification({
        message: `Reserva para ${displayGuests} persona(s) confirmada`,
        severity: 'success'
      });
      window.dispatchEvent(new Event('reservation-made'));
      setTimeout(() => {
        setSelected(null);
        setPersistentNotification(null); // Ocultar después de mostrar y cerrar tarjeta
      }, 3000); // Duración de la notificación antes de cerrar la tarjeta
    } catch (err: any) {
      const serverMsg = err.response?.data?.error as string | undefined;
      setPersistentNotification({
        message: serverMsg || 'Error al reservar',
        severity: 'error'
      });

      if (serverMsg &&
          (serverMsg.includes('Not enough tables') ||
           serverMsg.includes('No hay suficientes mesas'))) {
        setMessage('No hay mesas disponibles en ese horario. Por favor elige otro.'); // Mensaje para ReserveCard
      } else {
        // setMessage(serverMsg || 'Error al reservar'); // Mensaje para ReserveCard si se desea
      }
      setTimeout(() => {
        setPersistentNotification(null);
      }, 5000); // Duración de la notificación de error
    }
  };

  const handleSearchByAvailability = async () => {
    if (!filterAvailabilityDate || !filterAvailabilityTime || filterAvailabilityGuests <= 0) {
      setAvailabilitySearchMessage('Por favor, seleccione fecha, hora y número de comensales válidos.');
      return; // Don't close popover, let user correct
    }
    setIsSearchingAvailability(true);
    setAvailabilityFilterActive(true); // Mark that this filter is now active
    setRestaurantsMatchingAvailability([]);
    setAvailabilitySearchMessage(''); // Clear previous messages

    const formattedDateForAPI = formatDateFns(filterAvailabilityDate, 'yyyy-MM-dd');
    const [hour, minute] = filterAvailabilityTime.split(':').map(Number);
    
    const TZ_OFFSET_MS = -3 * 60 * 60 * 1000; 
    const localTimeAsTimestamp = Date.UTC(
        filterAvailabilityDate.getFullYear(),
        filterAvailabilityDate.getMonth(),
        filterAvailabilityDate.getDate(),
        hour,
        minute,
        0
    );
    const targetSlotUTCTimestamp = localTimeAsTimestamp - TZ_OFFSET_MS;

    // Use all restaurants for the initial availability check by date/time/guests
    const baseRestaurantsForAvailabilityCheck = restaurants; 

    const promises = baseRestaurantsForAvailabilityCheck.map(async (restaurant) => {
      try {
        const response = await axios.get<{ start: number; available_tables: number }[]>
          (`/api/restaurants/${restaurant.id}/availability?date=${formattedDateForAPI}`,
          { withCredentials: true }
        );
        const availableSlots = response.data;
        const neededTables = Math.ceil(filterAvailabilityGuests / 2);

        for (const slot of availableSlots) {
          if (slot.start === targetSlotUTCTimestamp && slot.available_tables >= neededTables) {
            return restaurant; 
          }
        }
        return null; 
      } catch (error) {
        // console.warn(`Error fetching availability for ${restaurant.name}:`, error);
        return null; 
      }
    });

    try {
      const results = await Promise.all(promises);
      const foundRestaurantsByTimeAndCapacity = results.filter(r => r !== null) as Restaurant[];

      // Further filter by selected availability tags
      let finalFilteredRestaurants = foundRestaurantsByTimeAndCapacity;
      if (filterAvailabilityTags.length > 0) {
        finalFilteredRestaurants = foundRestaurantsByTimeAndCapacity.filter(restaurant =>
          filterAvailabilityTags.every(tag => restaurant.tags?.includes(tag))
        );
      }

      setRestaurantsMatchingAvailability(finalFilteredRestaurants);
      if (finalFilteredRestaurants.length === 0) {
        setAvailabilitySearchMessage('No se encontraron restaurantes con disponibilidad para los criterios seleccionados.');
      } else {
        setAvailabilitySearchMessage(`${finalFilteredRestaurants.length} restaurante(s) encontrado(s) con disponibilidad.`);
      }
    } catch (error) {
      console.error("Error processing availability search:", error);
      setAvailabilitySearchMessage('Ocurrió un error al buscar disponibilidad.');
    } finally {
      setIsSearchingAvailability(false);
      handleCloseAvailabilityPopover(); // Close popover after search attempt
    }
  };

  const handleResetAvailabilityFilterInputsInPopover = () => {
    setFilterAvailabilityDate(new Date());
    setFilterAvailabilityTime('');
    setFilterAvailabilityGuests(2);
    setFilterAvailabilityTags([]);
    // Do not clear availabilitySearchMessage or change availabilityFilterActive here
  };
  
  const handleClearActiveAvailabilityFilter = () => {
    setAvailabilityFilterActive(false);
    setRestaurantsMatchingAvailability([]);
    setFilterAvailabilityDate(new Date());
    setFilterAvailabilityTime('');
    setFilterAvailabilityGuests(2);
    setFilterAvailabilityTags([]); // Clear tags as well
    setAvailabilitySearchMessage('');
    handleCloseAvailabilityPopover(); // Ensure popover is closed if it was open
  };


  if (!isLoaded) return <p>Cargando mapa...</p>;

  let baseRestaurantList = availabilityFilterActive ? restaurantsMatchingAvailability : restaurants;

  const visibleRestaurants = baseRestaurantList.filter(r => {
    const nameMatches = searchText === '' || r.name.toLowerCase().includes(searchText.toLowerCase());
    const tagsMatch = selectedCategories.length === 0 || 
                      (r.tags && selectedCategories.every(category => r.tags!.includes(category)));
    return nameMatches && tagsMatch;
  });


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Box sx={{
        padding: '1rem',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: 1.5, // Adjusted gap
        alignItems: 'center',
        flexWrap: 'wrap',     // Allow wrapping if space is tight
        width: '100%',         
        flexShrink: 0,
      }}>
        <TextField
          label="Buscar restaurante"
          variant="outlined"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          size="small"
          sx={{ width: '20%', minWidth: 140, flexShrink: 0 }} 
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Autocomplete
          multiple
          id="categories-filter-checkboxes"
          options={allCategories}
          value={selectedCategories}
          disableCloseOnSelect
          size="small"
          getOptionLabel={(option) => option}
          onChange={(event, newValue) => {
            setSelectedCategories(newValue);
          }}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option}
            </li>
          )}
          sx={{ width: '20%', minWidth: 150, flexShrink: 0 }} 
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Filtrar por categorías" 
              placeholder={selectedCategories.length > 0 ? "" : "Categorías"}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start" sx={{ pl: 0.5, color: 'action.active', mr: -0.5 }}>
                      <FilterListIcon />
                    </InputAdornment>
                    {params.InputProps.startAdornment} 
                  </>
                ),
              }}
            />
          )}
        />

        {/* Availability Filter Button and Popover */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <Button 
            variant="outlined" 
            onClick={handleOpenAvailabilityPopover}
            startIcon={<FilterListIcon />}
            size="medium" // Consistent with other buttons if any
            sx={{ height: '40px' }} // Match height of other inputs/buttons if desired
          >
            Disponibilidad
          </Button>
          {availabilityFilterActive && (
            <Button 
              variant="outlined" 
              onClick={handleClearActiveAvailabilityFilter}
              size="medium"
              color="secondary"
              sx={{ height: '40px' }}
            >
              Reiniciar Filtros
            </Button>
          )}
        </Box>

        <Popover
          open={Boolean(availabilityFilterAnchorEl)}
          anchorEl={availabilityFilterAnchorEl}
          onClose={handleCloseAvailabilityPopover}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, minWidth: '350px', maxWidth: '400px' }}>
            <Typography variant="subtitle1" gutterBottom>Filtrar por Disponibilidad</Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha"
                value={filterAvailabilityDate}
                onChange={(newValue) => setFilterAvailabilityDate(newValue)}
                minDate={new Date()}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
            <FormControl size="small" fullWidth>
              <InputLabel id="filter-time-popover-label">Hora</InputLabel>
              <Select
                labelId="filter-time-popover-label"
                value={filterAvailabilityTime}
                label="Hora"
                onChange={(e: SelectChangeEvent<string>) => setFilterAvailabilityTime(e.target.value)}
              >
                {timeSlots.map(slot => (
                  <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Comensales"
              type="number"
              size="small"
              fullWidth
              value={filterAvailabilityGuests}
              onChange={e => setFilterAvailabilityGuests(Math.max(1, parseInt(e.target.value, 10) || 1))}
              inputProps={{ min: 1 }}
            />
            <Autocomplete
              multiple
              id="availability-tags-filter"
              options={allCategories}
              value={filterAvailabilityTags}
              disableCloseOnSelect
              size="small"
              getOptionLabel={(option) => option}
              onChange={(event, newValue) => {
                setFilterAvailabilityTags(newValue);
              }}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option}
                </li>
              )}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Etiquetas (opcional)" 
                  placeholder={filterAvailabilityTags.length > 0 ? "" : "Etiquetas"}
                />
              )}
              fullWidth
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, gap: 1 }}>
              <Button 
                variant="text" 
                onClick={handleResetAvailabilityFilterInputsInPopover}
                size="small"
              >
                Limpiar Campos
              </Button>
              <Button 
                variant="contained" 
                onClick={handleSearchByAvailability} 
                disabled={isSearchingAvailability}
                size="small"
              >
                {isSearchingAvailability ? <CircularProgress size={20} color="inherit" /> : "Buscar"}
              </Button>
            </Box>
          </Box>
        </Popover>
      </Box>

      {/* The Alert will now be positioned relative to the map container */}
      {/* No changes needed for the Alert's conditional rendering here */}

      <Box sx={{ 
        flexGrow: 1, 
        width: '100%',
        height: '100%',
        position: 'relative' 
      }}>
        {persistentNotification && (
          <Alert
            severity={persistentNotification.severity}
            onClose={() => setPersistentNotification(null)} // Permite cierre manual
            sx={{
              position: 'absolute',
              top: '20px', // Ajusta la posición vertical según necesites
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1300, // Asegurar que esté sobre otros elementos como el ReserveCard
              width: 'fit-content',
              textAlign: 'center',
              boxShadow: 3,
            }}
          >
            {persistentNotification.message}
          </Alert>
        )}
        {availabilitySearchMessage && (
          <Alert 
            severity={availabilitySearchMessage.includes("Error") || availabilitySearchMessage.includes("No se encontraron") ? "warning" : "info"} 
            sx={{ 
              position: 'absolute',
              top: '10px', // Adjust as needed
              left: '50%',
              transform: 'translateX(-50%)', // Center the alert
              zIndex: 10, // Ensure it's above the map
              minWidth: '300px', // Optional: for better readability
              boxShadow: 3, // Optional: add some shadow
            }}
            onClose={() => setAvailabilitySearchMessage('')}
          >
            {availabilitySearchMessage}
          </Alert>
        )}
        {reservaConfirmadaMessage && (
          <Alert 
            icon={<CheckIcon fontSize="inherit" />} severity="success"
            sx={{ 
              position: 'absolute',
              top: '10px', // Adjust as needed
              left: '50%',
              transform: 'translateX(-50%)', // Center the alert
              zIndex: 10, // Ensure it's above the map
              minWidth: '300px', // Optional: for better readability
              boxShadow: 3, // Optional: add some shadow
            }}
            onClose={() => setReservaConfirmadaMessage('')}
          >
            {reservaConfirmadaMessage}
          </Alert>
        )}
        <GoogleMap
          center={center}
          zoom={12}
          mapContainerStyle={{ height: '100%', width: '100%' }} // El mapa llena su contenedor
        >
          {visibleRestaurants.map((r) => (
            <MarkerF
              key={r.id}
              position={{ lat: Number(r.latitude), lng: Number(r.longitude) }}
              title={`${r.name} (${r.seats_total/2} asientos totales)`}
              onClick={() => handleMarkerClick(r)}
              icon={{
                fillColor: '#ff2d00',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeOpacity: 2,
                strokeWeight: 2,
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
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
          guests={guests} // This is for ReserveCard's own guest input
          setGuests={setGuests} // This is for ReserveCard's own guest input
          handleReserve={handleReserve}
          setSelected={setSelected}
          message={message} // ReserveCard's specific message
        />
      )}
      {/* Eliminar el componente Snackbar */}
      {/* <Snackbar
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
      </Snackbar> */}
    </Box>
  );
}
