import React, { useState } from 'react';
import styles from '../styles/ReserveCard.module.scss';
import { Restaurant } from './Map';
import { DatePicker } from '@mui/x-date-pickers';
import { CircularProgress } from '@mui/material';

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
}

const ReserveCard: React.FC<ReserveCardProps> = ({
  selected,
  availability,
  selectedInterval,
  setSelectedInterval,
  date, // date is 'YYYY-MM-DD' string
  setDate,
  guests,
  setGuests,
  handleReserve,
  setSelected,
  message,
}) => {
  const [isReserving, setIsReserving] = useState(false);
  const [guestInput, setGuestInput] = useState(guests.toString());
  const [guestError, setGuestError] = useState('');

  React.useEffect(() => {
    setGuestInput(guests ? guests.toString() : '');
    if (guests < 1) {
      setGuestError('El número de personas debe ser al menos 1.');
    } else {
      setGuestError('');
    }
  }, [guests]);  
  if (!selected) return null;

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      // newDate from DatePicker is a local Date object
      const year = newDate.getFullYear();
      // JavaScript months are 0-indexed, so add 1 for 1-indexed month string
      const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
      const day = newDate.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setDate(formattedDate);
    }
  };

  // Create a local Date object for the DatePicker value
  // Memoize the calculation of dateForPickerValue to avoid re-creating Date objects unnecessarily
  const dateForPickerValue = React.useMemo(() => {
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [yearNum, monthNum, dayNum] = date.split('-').map(Number);
      // monthNum is 1-indexed from the string, convert to 0-indexed for Date constructor
      return new Date(yearNum, monthNum - 1, dayNum);
    }
    return null; // DatePicker can handle null if the date string is not valid or empty
  }, [date]);

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
      <h2>{selected.name}</h2>
      <p>Horario: 10:00 AM - 01:00 AM</p>
      <p>{selected.description}</p>
      <p>Dirección: {selected.address}</p>
      <p>Teléfono: {selected.phone}</p>
      <p>Email: {selected.email}</p>
      <p>Mesas disponibles: {selected.tables_total}</p>

      <label>
        Fecha:
          <DatePicker
            value={dateForPickerValue} // Use the local Date object
            onChange={handleDateChange}
            minDate={new Date()}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                className: styles.datePickerInput
              },
            }}
          />
      </label>

      {availability.length > 0 && (
        <label>
          Horario:          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className={styles.select}
          >
            {availability.map((a) => {
              // Convert UTC timestamp to local restaurant time (UTC-3)
              const dt = new Date(a.start);
              // Calculate local restaurant time by applying UTC-3 offset
              const localTime = new Date(dt.getTime() - (3 * 60 * 60 * 1000));
              const h = String(localTime.getUTCHours()).padStart(2, '0');
              const m = String(localTime.getUTCMinutes()).padStart(2, '0');
              return (
                <option key={a.start} value={a.start}>
                  {`${h}:${m}`} ({a.available_tables} mesas)
                </option>
              );
            })}
          </select>
        </label>
      )}

      <label>
        Personas:
        <input
          type="number"
          min={1} // Ayuda a prevenir negativos en algunos navegadores
          value={guestInput}
          onChange={(e) => {
            const value = e.target.value;
            setGuestInput(value); // Actualizar el input visualmente
            const num = parseInt(value, 10);

            if (value === '' || isNaN(num)) { // Si está vacío o no es un número
              setGuests(1); // Opcional: resetear a 1 o manejar como prefieras
              setGuestError('Por favor, ingrese un número válido.');
            } else if (num < 1) {
              setGuests(1); // Corregir el estado guests a 1
              setGuestError('El número de personas no puede ser menor a 1.');
            } else {
              setGuests(num);
              setGuestError(''); // Limpiar error si el número es válido
            }
          }}
          className={styles.input}
        />
      </label>
      {guestError && <p className={styles.errorMessage} style={{ color: 'red', fontSize: '0.8em' }}>{guestError}</p>}

      <button 
        className={styles.reserveBtn} 
        onClick={handleReserveClick} 
        disabled={!selectedInterval || guests < 1 || isReserving || !!guestError}
      >
        {isReserving ? (
          <>
            <CircularProgress size={20} color="inherit" style={{ marginRight: 8 }} />
            Creando reserva...
          </>
        ) : (
          'Reservar'
        )}
      </button>

      <button className={styles.closeBtn} onClick={() => setSelected(null)}>
        Cerrar
      </button>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default ReserveCard;