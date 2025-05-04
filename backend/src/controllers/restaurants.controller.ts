import { Request, Response } from 'express';
import { db } from '../db';

export const getAll = async (_: Request, res: Response) => {
  const { rows } = await db.query(
    'SELECT id, name, latitude, longitude, description, seats_total, (seats_total/2)::int AS tables_total FROM restaurants'
  );
  res.json(rows);
};

export const getById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rows } = await db.query(
    'SELECT id, name, latitude, longitude, description, phone, email, address, seats_total, (seats_total/2)::int AS tables_total FROM restaurants WHERE id = $1',
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(rows[0]);
};

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;
// Obtiene disponibilidad por intervalos de 15 minutos para un día dado
export const getAvailability = async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.id);
  const date = req.query.date as string;
  if (!date) return res.status(400).json({ error: 'Date query parameter is required' });
  // Parse date and compute local midnight
  const [y, m, d] = date.split('-').map(Number);
  const base = new Date(y, m - 1, d, 0, 0, 0).getTime();
 // ---- genera intervalos 10:00 → 23:30 (cada 15’)
  const openMin = 10 * 60;
  const lastResMin = 23 * 60 + 30;
  const intervals: { start: number; end: number }[] = [];
  for (let mins = openMin; mins <= lastResMin; mins += 15) {
    const start = base + mins * 60_000 + TZ_OFFSET_MS;
    const end = start + 90 * 60000;
    intervals.push({ start, end });
  }
  // Fetch seats_total
  const { rows: restRows } = await db.query('SELECT seats_total FROM restaurants WHERE id=$1', [restaurant_id]);
  if (!restRows.length) return res.status(404).json({ error: 'Restaurant not found' });
  const tables_total = Math.floor(restRows[0].seats_total / 2);
  // Ventana local del día (UTC-3)
  const dateStart = new Date(y, m-1, d, 0, 0, 0);          // UTC
  const dateEnd   = new Date(y, m-1, d, 23, 59, 59);       // UTC
  const { rows: resRows } = await db.query(
    `SELECT reservation_at, guests FROM reservations
     WHERE restaurant_id=$1
       AND status IN ('pending','confirmed')
       AND reservation_at + INTERVAL '90 minutes' > $2
       AND reservation_at < $3`,
    [restaurant_id, dateStart, dateEnd]
  );
  // Compute availability
  const availability = intervals.map(({ start, end }) => {
    const usedTables = resRows.reduce((sum: number, r:any) => {
        const rStartMs = new Date(r.reservation_at).getTime();
        const rEndMs   = rStartMs + 90 * 60_000;
        return rStartMs < end && rEndMs > start
          ? sum + Math.ceil(r.guests / 2)
          : sum;
    }, 0);
    return { start, available_tables: tables_total - usedTables };
  });
  res.json(availability);
};

// Obtiene todas las reservas de un restaurante (para confirmación)
export const getRestaurantReservations = async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.id);
  const { rows } = await db.query(
    `SELECT id, user_id, reservation_at, requested_guests, guests, status, presence_confirmed
     FROM reservations WHERE restaurant_id=$1 ORDER BY reservation_at`,
    [restaurant_id]
  );
  res.json(rows);
};
