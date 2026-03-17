import { Request, Response } from 'express';
import { db } from '../db';
import { newReservationsCounter } from '../metrics/prometheus';
import { io } from '../sockets/occupancySocket';
import { extractAuthUser } from '../utils/auth';
import {
  RESERVATION_DURATION_MS,
  RESERVATION_WINDOW_LABEL,
  isWithinRestaurantHours
} from '../utils/reservationTime';
import {
  sendReservationCancellationEmail,
  sendReservationConfirmationEmail
} from '../utils/mailer';

const parsePositiveInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getAuthUser = (req: Request) => req.authUser ?? extractAuthUser(req);

export const createReservation = async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (authUser.role !== 'user' && authUser.role !== 'customer') {
    return res
      .status(403)
      .json({ error: 'Forbidden: Only customers can create reservations.' });
  }

  const restaurantId = parsePositiveInteger(req.body.restaurant_id);
  const reservationTimestamp = Number(req.body.reservation_at);
  const requestedGuests = parsePositiveInteger(req.body.guests);

  if (!restaurantId) {
    return res.status(400).json({ error: 'Restaurant id is invalid.' });
  }

  if (!Number.isFinite(reservationTimestamp)) {
    return res.status(400).json({ error: 'Reservation date is invalid.' });
  }

  if (!requestedGuests) {
    return res
      .status(400)
      .json({ error: 'La cantidad de personas debe ser un entero positivo.' });
  }

  const start = new Date(reservationTimestamp);
  if (Number.isNaN(start.getTime())) {
    return res.status(400).json({ error: 'Reservation date is invalid.' });
  }

  if (start.getTime() < Date.now()) {
    return res
      .status(400)
      .json({ error: 'No se puede hacer una reserva en el pasado.' });
  }

  if (!isWithinRestaurantHours(start)) {
    return res.status(400).json({
      error: `Horario de reserva invalido. Las reservas estan disponibles de ${RESERVATION_WINDOW_LABEL}.`
    });
  }

  const assignedGuests = requestedGuests % 2 ? requestedGuests + 1 : requestedGuests;
  const end = new Date(start.getTime() + RESERVATION_DURATION_MS);
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const { rows: restaurantRows } = await client.query(
      'SELECT seats_total, name FROM restaurants WHERE id = $1 FOR UPDATE',
      [restaurantId]
    );

    if (!restaurantRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const { seats_total, name: restaurantName } = restaurantRows[0];
    const { rows: usedRows } = await client.query(
      `SELECT COALESCE(SUM((guests + 1) / 2), 0)::int AS used_tables
       FROM reservations
       WHERE restaurant_id = $1
         AND status IN ('pending', 'confirmed')
         AND reservation_at < $3
         AND reservation_at + INTERVAL '90 minutes' > $2`,
      [restaurantId, start, end]
    );

    const usedTables = usedRows[0].used_tables;
    const tablesTotal = Math.floor(seats_total / 2);
    const neededTables = Math.ceil(requestedGuests / 2);

    if (tablesTotal - usedTables < neededTables) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No hay suficientes mesas en ese horario' });
    }

    const reservationInsertResult = await client.query(
      `INSERT INTO reservations (user_id, restaurant_id, reservation_at, requested_guests, guests, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, restaurant_id, reservation_at, requested_guests, guests, status, presence_confirmed, presence_confirmed_at`,
      [authUser.id, restaurantId, start, requestedGuests, assignedGuests, 'pending']
    );

    await client.query('COMMIT');

    const newReservation = reservationInsertResult.rows[0];
    newReservationsCounter.inc({
      restaurant_id: newReservation.restaurant_id.toString(),
      restaurant_name: restaurantName
    });

    const reservationForSocket = {
      ...newReservation,
      user_name: authUser.name,
      user_email: authUser.email
    };

    try {
      await sendReservationConfirmationEmail(
        authUser.email,
        restaurantName,
        requestedGuests,
        reservationTimestamp
      );
    } catch (mailError) {
      console.error('Mail error', mailError);
    }

    io.to(`restaurant_${restaurantId}`).emit('new_reservation', {
      reservation: reservationForSocket
    });
    io.to(`restaurant_${restaurantId}`).emit('occupancy_update', {
      restaurant_id: restaurantId
    });

    return res.status(201).json({
      message: 'Reserva creada correctamente',
      reservation: reservationForSocket
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to rollback createReservation transaction', rollbackError);
    }

    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

export const getReservations = async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { rows } = await db.query(
      `SELECT r.id, r.restaurant_id, rest.name AS restaurant_name,
              r.reservation_at, r.requested_guests, r.guests, r.status
       FROM reservations r
       JOIN restaurants rest ON rest.id = r.restaurant_id
       WHERE r.user_id = $1`,
      [authUser.id]
    );

    const sortedReservations = rows.sort(
      (left: any, right: any) =>
        new Date(left.reservation_at).getTime() - new Date(right.reservation_at).getTime()
    );

    return res.status(200).json(sortedReservations);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const deleteReservation = async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const reservationId = parsePositiveInteger(req.params.id);
  if (!reservationId) {
    return res.status(400).json({ error: 'Reservation id is invalid.' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT r.restaurant_id, r.requested_guests, r.reservation_at, rest.name AS restaurant_name
       FROM reservations r
       JOIN restaurants rest ON rest.id = r.restaurant_id
       WHERE r.id = $1 AND r.user_id = $2
       FOR UPDATE`,
      [reservationId, authUser.id]
    );

    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const { restaurant_id, requested_guests, reservation_at, restaurant_name } = rows[0];

    await client.query('DELETE FROM reservations WHERE id = $1', [reservationId]);
    await client.query('COMMIT');

    try {
      await sendReservationCancellationEmail(
        authUser.email,
        restaurant_name,
        requested_guests,
        new Date(reservation_at).getTime()
      );
    } catch (mailError) {
      console.error('Mail error', mailError);
    }

    io.to(`restaurant_${restaurant_id}`).emit('occupancy_update', { restaurant_id });
    return res.status(200).json({ message: 'Reservation cancelled' });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Failed to rollback deleteReservation transaction', rollbackError);
    }

    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

export const confirmPresence = async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res
      .status(401)
      .json({ error: 'Unauthorized - Client cannot confirm presence this way' });
  }

  const reservationId = parsePositiveInteger(req.params.id);
  if (!reservationId) {
    return res.status(400).json({ error: 'Reservation id is invalid.' });
  }

  const { rows } = await db.query(
    'SELECT restaurant_id FROM reservations WHERE id = $1 AND user_id = $2',
    [reservationId, authUser.id]
  );

  if (!rows.length) {
    return res
      .status(404)
      .json({ error: 'Reservation not found or does not belong to user' });
  }

  const restaurantId = rows[0].restaurant_id;
  await db.query(
    `UPDATE reservations
     SET presence_confirmed = TRUE,
         presence_confirmed_at = NOW(),
         status = 'confirmed'
     WHERE id = $1`,
    [reservationId]
  );

  io.to(`restaurant_${restaurantId}`).emit('occupancy_update', {
    restaurant_id: restaurantId
  });

  return res.json({ message: 'Presence confirmed' });
};
