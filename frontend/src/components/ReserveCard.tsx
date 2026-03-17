import React, { useEffect, useMemo, useState } from 'react';
import { Chip, CircularProgress } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import styles from '../styles/ReserveCard.module.scss';
import { Restaurant } from './Map';

interface Availability {
  start: number;
  available_tables: number;
}

interface ReserveCardProps {
  selected: Restaurant | null;
  availability: Availability[];
  selectedInterval: string;
  setSelectedInterval: React.Dispatch<React.SetStateAction<string>>;
  date: string;
  setDate: React.Dispatch<React.SetStateAction<string>>;
  guests: number;
  setGuests: React.Dispatch<React.SetStateAction<number>>;
  handleReserve: () => void;
  setSelected: React.Dispatch<React.SetStateAction<Restaurant | null>>;
  message: string;
  isLoadingAvailability: boolean;
  formatAvailabilityTimestamp: (timestamp: number) => string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const ReserveCard: React.FC<ReserveCardProps> = ({
  selected,
  availability,
  selectedInterval,
  setSelectedInterval,
  date,
  setDate,
  guests,
  setGuests,
  handleReserve,
  setSelected,
  message,
  isLoadingAvailability,
  formatAvailabilityTimestamp,
  isFavorite,
  onToggleFavorite
}) => {
  const [isReserving, setIsReserving] = useState(false);
  const [guestInput, setGuestInput] = useState(guests.toString());
  const [guestError, setGuestError] = useState('');

  useEffect(() => {
    setGuestInput(guests.toString());
    setGuestError(guests < 1 ? 'El numero de personas debe ser al menos 1.' : '');
  }, [guests]);

  const dateForPickerValue = useMemo(() => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return null;
    }

    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [date]);

  const requiredTables = Math.max(1, Math.ceil(Math.max(guests, 1) / 2));
  const compatibleAvailability = useMemo(
    () => availability.filter((slot) => slot.available_tables >= requiredTables),
    [availability, requiredTables]
  );

  useEffect(() => {
    if (!date) {
      if (selectedInterval) {
        setSelectedInterval('');
      }
      return;
    }

    if (compatibleAvailability.length === 0) {
      if (selectedInterval) {
        setSelectedInterval('');
      }
      return;
    }

    if (!compatibleAvailability.some((slot) => String(slot.start) === selectedInterval)) {
      setSelectedInterval(String(compatibleAvailability[0].start));
    }
  }, [compatibleAvailability, date, selectedInterval, setSelectedInterval]);

  if (!selected) {
    return null;
  }

  const handleDateChange = (newDate: Date | null) => {
    if (!newDate) {
      setDate('');
      return;
    }

    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
  };

  const handleReserveClick = async () => {
    setIsReserving(true);

    try {
      await handleReserve();
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <div className={styles.reserveCard}>
      <div className={styles.header}>
        <div>
          <h2>{selected.name}</h2>
          {selected.neighborhood && <p className={styles.neighborhood}>{selected.neighborhood}</p>}
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.ghostBtn} onClick={onToggleFavorite}>
            {isFavorite ? 'Guardado' : 'Guardar'}
          </button>
          <button type="button" className={styles.ghostBtn} onClick={() => setSelected(null)}>
            Cerrar
          </button>
        </div>
      </div>

      <p className={styles.description}>{selected.description}</p>

      <div className={styles.meta}>
        <p>
          <strong>Horario:</strong> 10:00 AM a 11:30 PM
        </p>
        {selected.address && (
          <p>
            <strong>Direccion:</strong> {selected.address}
          </p>
        )}
        {selected.phone && (
          <p>
            <strong>Telefono:</strong> {selected.phone}
          </p>
        )}
        {selected.email && (
          <p>
            <strong>Email:</strong> {selected.email}
          </p>
        )}
        {selected.tables_total && (
          <p>
            <strong>Mesas:</strong> {selected.tables_total}
          </p>
        )}
      </div>

      {selected.tags && selected.tags.length > 0 && (
        <div className={styles.tags}>
          {selected.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </div>
      )}

      <label>
        Fecha
        <DatePicker
          value={dateForPickerValue}
          onChange={handleDateChange}
          minDate={new Date()}
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
              className: styles.datePickerInput
            }
          }}
        />
      </label>

      {date && (
        <div className={styles.availabilityState}>
          {isLoadingAvailability ? (
            <div className={styles.loadingLine}>
              <CircularProgress size={18} />
              <span>Consultando disponibilidad...</span>
            </div>
          ) : compatibleAvailability.length > 0 ? (
            <label>
              Horario
              <select
                value={selectedInterval}
                onChange={(event) => setSelectedInterval(event.target.value)}
                className={styles.select}
              >
                {compatibleAvailability.map((slot) => (
                  <option key={slot.start} value={slot.start}>
                    {formatAvailabilityTimestamp(slot.start)} ({slot.available_tables} mesas)
                  </option>
                ))}
              </select>
            </label>
          ) : availability.length > 0 ? (
            <p className={styles.helperText}>
              Hay turnos en esta fecha, pero no alcanzan para {guests} persona(s).
            </p>
          ) : (
            <p className={styles.helperText}>
              No hay turnos disponibles para la fecha seleccionada.
            </p>
          )}
        </div>
      )}

      <label>
        Personas
        <input
          type="number"
          min={1}
          value={guestInput}
          onChange={(event) => {
            const value = event.target.value;
            setGuestInput(value);

            const parsed = parseInt(value, 10);
            if (value === '' || Number.isNaN(parsed)) {
              setGuests(1);
              setGuestError('Ingresa un numero valido.');
            } else if (parsed < 1) {
              setGuests(1);
              setGuestError('El numero de personas no puede ser menor a 1.');
            } else {
              setGuests(parsed);
              setGuestError('');
            }
          }}
          className={styles.input}
        />
      </label>

      {guestError && <p className={styles.errorMessage}>{guestError}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.reserveBtn}
          onClick={handleReserveClick}
          disabled={
            !selectedInterval || guests < 1 || isReserving || isLoadingAvailability || !!guestError
          }
        >
          {isReserving ? (
            <>
              <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
              Creando reserva...
            </>
          ) : (
            'Reservar'
          )}
        </button>
      </div>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default ReserveCard;
