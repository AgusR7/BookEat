import { Request, Response } from 'express';
import { db } from '../db';
import { io } from '../sockets/occupancySocket';

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

const TZ_OFFSET_MS = -3 * 60 * 60 * 1000; // UTC-3 timezone in milliseconds
// Obtiene disponibilidad por intervalos de 15 minutos para un día dado
export const getAvailability = async (req: Request, res: Response) => {
  const restaurant_id = Number(req.params.id);
  const date = req.query.date as string;
  if (!date) return res.status(400).json({ error: 'Date query parameter is required' });
  
  // Parse date and generate time slots for restaurant hours (10:00 AM - 11:30 PM local time)
  const [y, m, d] = date.split('-').map(Number);

  // Generate intervals from 10:00 AM to 11:30 PM local time (every 15 minutes)
  const openMin = 10 * 60; // Local 10:00 AM in minutes from midnight
  const lastResMin = 23 * 60 + 30; // Local 11:30 PM in minutes from midnight
  const intervals: { start: number; end: number }[] = [];
  const slotDurationMs = 15 * 60 * 1000; // Duration of each availability slot (15 minutes)

  for (let mins = openMin; mins <= lastResMin; mins += 15) {
    // Calculate local time first, then convert to UTC
    // Create local time as if it were UTC, then adjust for timezone
    const localTimeAsUtc = Date.UTC(y, m - 1, d, Math.floor(mins / 60), mins % 60, 0);
    // Convert local time to UTC by subtracting the timezone offset
    const slotStartUtc = localTimeAsUtc - TZ_OFFSET_MS; // For UTC-3, subtract -3 hours (add 3 hours)
    const slotEndUtc = slotStartUtc + slotDurationMs; // End of the 15-minute slot in UTC
    intervals.push({ start: slotStartUtc, end: slotEndUtc });
  }  // Fetch seats_total
  const { rows: restRows } = await db.query('SELECT seats_total FROM restaurants WHERE id=$1', [restaurant_id]);
  if (!restRows.length) return res.status(404).json({ error: 'Restaurant not found' });
  const tables_total = Math.floor(restRows[0].seats_total / 2);
  
  // Define the date window to query reservations for the entire day in UTC
  // We need to query a wider window to catch reservations that might extend into the next day
  const localMidnight = Date.UTC(y, m - 1, d, 0, 0, 0);
  const dateStart = new Date(localMidnight - TZ_OFFSET_MS); // Start of local day in UTC
  const dateEnd = new Date(localMidnight - TZ_OFFSET_MS + 24 * 60 * 60 * 1000); // End of local day in UTC
  const { rows: resRows } = await db.query(
    `SELECT reservation_at, guests FROM reservations
     WHERE restaurant_id=$1
       AND status IN ('pending','confirmed')
       AND reservation_at + INTERVAL '90 minutes' > $2
       AND reservation_at < $3`,
    [restaurant_id, dateStart, dateEnd]
  );
  // Compute availability
  const availability = intervals.map(({ start: slotStartUtc, end: slotEndUtc }) => {
    const usedTables = resRows.reduce((sum: number, r:any) => {
        const rStartUtc = new Date(r.reservation_at).getTime();
        const rEndUtc   = rStartUtc + 90 * 60_000; // Reservation lasts 90 minutes
        // Check for overlap: reservation [rStartUtc, rEndUtc) vs slot [slotStartUtc, slotEndUtc)
        // A slot is occupied if the reservation period overlaps with the slot period.
        if (rStartUtc < slotEndUtc && rEndUtc > slotStartUtc) {
          return sum + Math.ceil(r.guests / 2);
        }
        return sum;
    }, 0);
    return { start: slotStartUtc, available_tables: tables_total - usedTables };
  });
  res.json(availability);
};

// Obtiene todas las reservas de un restaurante (para confirmación)
export const getRestaurantReservations = async (req: Request, res: Response) => {
  const restaurantSession = (req.session as any).restaurant;
  if (!restaurantSession || !restaurantSession.restaurant_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { rows } = await db.query(
      `SELECT r.*, u.name as user_name, u.email as user_email
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.restaurant_id = $1
       ORDER BY r.reservation_at DESC`,
      [restaurantSession.restaurant_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching restaurant reservations:', error);
    res.status(500).json({ error: 'Error al obtener las reservas' });
  }
};

export const confirmPresence = async (req: Request, res: Response) => {
  const restaurantSession = (req.session as any).restaurant;
  if (!restaurantSession || !restaurantSession.restaurant_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const reservationId = Number(req.params.id);
  const { present } = req.body; // esperamos un boolean: true para asistió, false para no asistió

  if (typeof present !== 'boolean') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud debe incluir un campo "present" booleano.' });
  }

  try {
    // Verify the reservation belongs to this restaurant
    const { rows } = await db.query(
      'SELECT * FROM reservations WHERE id = $1 AND restaurant_id = $2',
      [reservationId, restaurantSession.restaurant_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const newStatus = present ? 'confirmed' : 'no-show';
    // Update the reservation
    await db.query(
      `UPDATE reservations 
       SET presence_confirmed = $1, 
           presence_confirmed_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END,
           status = $2
       WHERE id = $3`,
      [present, newStatus, reservationId]
    );

    // Emit socket event for real-time updates
    io.to(`restaurant_${restaurantSession.restaurant_id}`).emit('reservation_updated', {
      reservation_id: reservationId,
      presence_confirmed: present,
      status: newStatus
    });

    res.json({ message: present ? 'Presencia confirmada' : 'Ausencia confirmada' });
  } catch (error) {
    console.error('Error confirming presence/absence:', error);
    res.status(500).json({ error: 'Error al confirmar presencia/ausencia' });
  }
};
