/// <reference types="vite/client" />

import React, { useEffect, useState } from 'react';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import axios from 'axios';
import io from 'socket.io-client';
import { User } from '../hooks/useAuth';

interface Restaurant {
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
}

interface MapProps {
  user: User;
}

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
  const [socket] = useState(() =>
    io('http://localhost:3001', { transports: ['websocket'] })
  );
  // Nuevo: estado para el centro del mapa
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: -34.9011, lng: -56.1645 });

  useEffect(() => {
    axios.get('/api/restaurants').then((res) => setRestaurants(res.data));
  }, []);

  useEffect(() => {
    restaurants.forEach((r) => {
      socket.emit('join_restaurant_room', r.id);
    });
    socket.on('occupancy_update', ({ restaurant_id }) => {
      axios.get('/api/restaurants').then((res) => setRestaurants(res.data));
    });
    return () => {
      socket.off('occupancy_update');
      socket.disconnect();
    };
  }, [restaurants]);

  useEffect(() => {
    if (selected && date) {
      axios
        .get<{ start: number; available_tables: number }[]>(
          `/api/restaurants/${selected.id}/availability?date=${date}`,
          { withCredentials: true }
        )
        .then((res) => setAvailability(res.data))
        .catch(console.error);
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
    // Centrar el mapa en el restaurante seleccionado
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
      const { requested_guests } = res.data;
      window.alert(`Reserva de ${requested_guests} personas confirmada`);
      window.dispatchEvent(new Event('reservation-made'));
      setMessage(`Reserva de ${requested_guests} personas confirmada`);
      setSelected(null);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Error al reservar');
    }
  };

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <>
      <GoogleMap
        center={center}
        zoom={12}
        mapContainerStyle={{ height: '80vh', width: '100%' }}
      >
        {restaurants.map((r) => (
          <MarkerF
            key={r.id}
            position={{ lat: Number(r.latitude), lng: Number(r.longitude) }}
            title={`${r.name} (${r.seats_total} asientos totales)`}
            onClick={() => handleMarkerClick(r)}
          />
        ))}
      </GoogleMap>
      {selected && (
        <div style={{ position: 'fixed', top: 80, right: 20, background: '#fff', padding: 20, border: '1px solid #ccc', zIndex: 10 }}>
          <h2>{selected.name}</h2>
          <p>Horario: 10:00 AM - 01:00 AM</p>
          <p>{selected.description}</p>
          <p>Dirección: {selected.address}</p>
          <p>Teléfono: {selected.phone}</p>
          <p>Email: {selected.email}</p>
          <p>Mesas disponibles: {selected.tables_total}</p>
          <label>
            Fecha:
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <br />
          {availability.length > 0 && (
            <label>
              Intervalo:
              <select value={selectedInterval} onChange={(e) => setSelectedInterval(e.target.value)}>
                <option value="">Selecciona intervalo</option>
                {availability.map((a) => (
                  <option key={a.start} value={a.start}>
                    {(() => {
                      const dt = new Date(a.start);
                      const h = String(dt.getHours()).padStart(2, '0');
                      const m = String(dt.getMinutes()).padStart(2, '0');
                      return `${h}:${m}`;
                    })()} ({a.available_tables} mesas)
                  </option>
                ))}
              </select>
            </label>
          )}
          <br />
          <label>
            Personas:
            <input type="number" min={1} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
          </label>
          <br />
          <button onClick={handleReserve} disabled={!selectedInterval || guests < 1}>
            Reservar
          </button>
          <button onClick={() => setSelected(null)} style={{ marginLeft: 10 }}>
            Cerrar
          </button>
          {message && <p>{message}</p>}
        </div>
      )}
    </>
  );
}
