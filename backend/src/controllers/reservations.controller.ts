import { Request, Response } from 'express';
import { db } from '../db';
import { io } from '../sockets/occupancySocket';
import { sendReservationConfirmationEmail, sendReservationCancellationEmail } from '../utils/mailer';

export const createReservation = async (req: Request, res: Response) => {
  // Check for session user (local auth) or OAuth user
  const userSession = (req.session as any).user || (req.isAuthenticated && req.isAuthenticated() ? (req as any).user : null);
  if (!userSession) return res.status(401).json({ error: 'Unauthorized' });

  // Ensure only customers can create reservations
  if (userSession.role !== 'user' && userSession.role !== 'customer') {
    return res.status(403).json({ error: 'Forbidden: Only customers can create reservations.' });
  }
  const { restaurant_id, reservation_at, guests } = req.body;
  // start time sent as epoch ms from client
  const start = new Date(reservation_at);
  // Validar que la fecha no sea en el pasado
  if (start < new Date()) {
    return res.status(400).json({ error: 'No se puede hacer una reserva en el pasado.' });
  }
  // round to even number of seats
  const requestedGuests = Number(guests);
  const assignedGuests = requestedGuests % 2 ? requestedGuests + 1 : requestedGuests;
  
  // Constantes de horario del restaurante (hora local UTC-3)
  const OPEN_HOUR = 10; // 10:00 AM
  const CLOSE_HOUR = 23; // 11:00 PM  
  const LAST_MINUTE = 30; // 11:30 PM is the last reservation time
  const TZ_OFFSET_MS = -3 * 60 * 60 * 1000; // UTC-3 timezone in milliseconds
  
  // Convertir la timestamp UTC a hora local (UTC-3)
  // The client sends UTC time, we need to check it against local restaurant hours
  const startUtc = new Date(reservation_at);
  const startLocal = new Date(startUtc.getTime() + TZ_OFFSET_MS);
  
  // Get local hour and minutes (using UTC methods since we already adjusted the time)
  const localHour = startLocal.getUTCHours();
  const localMinutes = startLocal.getUTCMinutes();
  
  // Validar horarios de apertura (10:00 AM - 11:30 PM local time)
  // Restaurant closes at 1:00 AM (01:00) so last reservation is at 11:30 PM (23:30)
  const isAfterClosing = localHour > CLOSE_HOUR || (localHour === CLOSE_HOUR && localMinutes > LAST_MINUTE);
  const isBeforeOpening = localHour < OPEN_HOUR;
  
  if (isBeforeOpening || isAfterClosing) {
    return res.status(400).json({ 
      error: 'Horario de reserva inválido. Las reservas están disponibles de 10:00 AM a 11:30 PM.' 
    });
  }
  const end = new Date(start.getTime() + 90 * 60000); // 1h30
  const client = await db.connect();
  try {
    // get restaurant capacity
    const { rows: restRows } = await client.query(
      'SELECT seats_total, name FROM restaurants WHERE id=$1',
      [restaurant_id]
    );
    if (!restRows.length) return res.status(404).json({ error: 'Restaurant not found' });
    const { seats_total, name: restaurantName } = restRows[0];
    // calculate used tables in overlapping reservations
    const { rows: usedRows } = await client.query(
      `SELECT COALESCE(SUM((guests + 1)/2),0)::int AS used_tables
       FROM reservations
       WHERE restaurant_id=$1
         AND status IN ('pending','confirmed')
         AND reservation_at < $3
         AND reservation_at + INTERVAL '90 minutes' > $2`,
      [restaurant_id, start, end]
    );
    const usedTables = usedRows[0].used_tables;
    const tablesTotal = Math.floor(seats_total / 2);
    const neededTables = Math.ceil(requestedGuests / 2);
    if (tablesTotal - usedTables < neededTables) {
      return res.status(400).json({ error: 'Not enough tables in selected interval' });
    }
    // insert reservation and return all its data including user info
    const reservationInsertResult = await client.query(
      `INSERT INTO reservations (user_id, restaurant_id, reservation_at, requested_guests, guests, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, restaurant_id, reservation_at, requested_guests, guests, status, presence_confirmed, presence_confirmed_at`,
      [userSession.id, restaurant_id, start, requestedGuests, assignedGuests, 'pending'] // Added 'pending' status
    );

    const newReservationData = reservationInsertResult.rows[0];

    // Construct the reservation object to be sent via socket, including user details
    const reservationForSocket: any = {
      ...newReservationData,
      user_name: userSession.name, // Name from the session of the user who made the reservation
      user_email: userSession.email // Email from the session
    };

    // notification email
    try {
      // Use the new function for sending confirmation email
      await sendReservationConfirmationEmail(
        userSession.email,
        restaurantName,
        requestedGuests, // Changed from assignedGuests to requestedGuests
        reservation_at
      );
    } catch (mailErr) {
      console.error('Mail error', mailErr);
    }

    // Emit socket event for new reservation
    io.to(`restaurant_${restaurant_id}`).emit('new_reservation', { reservation: reservationForSocket });

    // Also emit occupancy_update if you still need it for other purposes
    io.to(`restaurant_${restaurant_id}`).emit('occupancy_update', { restaurant_id });

    res.status(201).json({ 
      message: 'Reservation confirmed',
      reservation: reservationForSocket // Send back the full reservation object
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

export const getReservations = async (req: Request, res: Response) => {
  // Check for session user (local auth) or OAuth user
  const userSession = (req.session as any).user || (req.isAuthenticated && req.isAuthenticated() ? (req as any).user : null);
  if (!userSession) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { rows } = await db.query(
      `SELECT r.id, r.restaurant_id, rest.name AS restaurant_name,
              r.reservation_at, r.requested_guests, r.guests, r.status
       FROM reservations r
       JOIN restaurants rest ON rest.id = r.restaurant_id
       WHERE r.user_id = $1`,
      [userSession.id]
    );
    const sorted = rows.sort((a: any, b: any) => new Date(a.reservation_at).getTime() - new Date(b.reservation_at).getTime());
    res.status(200).json(sorted); // Explicitly set status
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteReservation = async (req: Request, res: Response) => {
  // Check for session user (local auth) or OAuth user
  const userSession = (req.session as any).user || (req.isAuthenticated && req.isAuthenticated() ? (req as any).user : null);
  if (!userSession) return res.status(401).json({ error: 'Unauthorized' });
  const id = Number(req.params.id);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT r.restaurant_id, r.requested_guests, r.reservation_at, rest.name AS restaurant_name FROM reservations r JOIN restaurants rest ON rest.id = r.restaurant_id WHERE r.id = $1 AND r.user_id = $2 FOR UPDATE',
      [id, userSession.id]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found' });
    }
    const { restaurant_id, requested_guests, reservation_at, restaurant_name } = rows[0]; // Changed guests to requested_guests
    await client.query('DELETE FROM reservations WHERE id = $1', [id]);
    await client.query('COMMIT');
    try {
      // Use the new function for sending cancellation email
      await sendReservationCancellationEmail(
        userSession.email,
        restaurant_name,
        requested_guests, // Changed guests to requested_guests
        new Date(reservation_at).getTime()
      );
    } catch (mailErr) {
      console.error('Mail error', mailErr);
    }
    io.to(`restaurant_${restaurant_id}`).emit('occupancy_update', { restaurant_id });
    res.status(200).json({ message: 'Reservation cancelled' }); // Explicitly set status
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

// Confirm presence endpoint for restaurants
// This confirmPresence is actually for the restaurant dashboard, not client reservations.
// It was mistakenly in reservations.controller.ts, it should be in restaurants.controller.ts
// For now, let's assume it stays here and fix its auth logic if it were to be used by a client (which it shouldn't)
// However, the correct confirmPresence is in restaurants.controller.ts and uses req.session.restaurant
export const confirmPresence = async (req: Request, res: Response) => {
  const userSession = (req.session as any).user; // If a client could confirm presence, this would be the check
  // const restaurantSession = (req.session as any).restaurant; // If this was for restaurant
  
  // THIS IS LIKELY DEAD CODE OR MISPLACED as confirmPresence is handled by restaurants.controller.ts for restaurant users
  if (!userSession) { // Example if a client were to confirm, but this endpoint is likely not used by clients
     return res.status(401).json({ error: 'Unauthorized - Client cannot confirm presence this way' });
  }

  const id = Number(req.params.id);
  // ... (rest of the logic, which is probably not hit if clients don't use this specific endpoint)
  const { rows } = await db.query(
    'SELECT restaurant_id FROM reservations WHERE id=$1 AND user_id = $2', // Added user_id check for client context
    [id, userSession.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Reservation not found or does not belong to user' });
  const restaurant_id = rows[0].restaurant_id;
  await db.query(
    `UPDATE reservations
     SET presence_confirmed = TRUE,
         presence_confirmed_at = NOW(),
         status = 'confirmed'
     WHERE id = $1`,
    [id]
  );
  io.to(`restaurant_${restaurant_id}`).emit('occupancy_update', { restaurant_id });
  res.json({ message: 'Presence confirmed' });
};
