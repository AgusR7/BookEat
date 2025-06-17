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
  const [guests, setGuests] = useState(1);
  const [date, setDate] = useState('');
  const [availability, setAvailability] = useState<{ start: number; available_tables: number }[]>([]);
  const [selectedInterval, setSelectedInterval] = useState('');
  const [message, setMessage] = useState('');
  const socket = useSocket();
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: -34.9011, lng: -56.1645 });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchText, setSearchText] = useState(''); // searchText state was already present

  const allCategories = Array.from(
    new Set(restaurants.flatMap(r => r.tags || []))
  ).sort();

  const filteredRestaurants = restaurants.filter(r =>
    selectedCategories.length === 0 ||
    (r.tags && selectedCategories.every(category => r.tags!.includes(category)))
  );

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
          console.error(err);
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
    setCenter({ lat: Number(r.latitude), lng: Number(r.longitude) });
  };

  const handleReserve = async () => {
    setMessage('');
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
      window.alert(`Reserva de ${displayGuests} personas confirmada`);
      window.dispatchEvent(new Event('reservation-made'));
      setMessage(`Reserva de ${displayGuests} personas confirmada`);
      setSelected(null);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Error al reservar');
    }
  };

  if (!isLoaded) return <p>Cargando mapa...</p>;

  const visibleRestaurants = filteredRestaurants.filter(r =>
    r.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Box sx={{
        padding: '1rem',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap',
        width: '100%', // Asegurar que ocupe todo el ancho
        flexShrink: 0, // Evitar que este Box se encoja
      }}>
        <TextField
          label="Buscar restaurante"
          variant="outlined"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
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
          sx={{ flex: 1, minWidth: 250 }}
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
      </Box>

      <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}> {/* Contenedor para que el mapa crezca */}
        <GoogleMap
          center={center}
          zoom={12}
          mapContainerStyle={{ height: '100%', width: '100%' }} // El mapa ocupa el 100% de este Box
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
          guests={guests}
          setGuests={setGuests}
          handleReserve={handleReserve}
          setSelected={setSelected}
          message={message}
        />
      )}
    </Box>
  );
}
