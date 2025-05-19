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
          Horario:
          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className={styles.select}
          >
            {availability.map((a) => {
              const dt = new Date(a.start);
              const h = String(dt.getHours()).padStart(2, '0');
              const m = String(dt.getMinutes()).padStart(2, '0');
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
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className={styles.input}
        />
      </label>

      <button 
        className={styles.reserveBtn} 
        onClick={handleReserveClick} 
        disabled={!selectedInterval || guests < 1 || isReserving}
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