import { Request, Response } from 'express';
import { db } from '../db';
import { io } from '../sockets/occupancySocket';
import { extractAuthUser } from '../utils/auth';
import {
  RESERVATION_DURATION_MS,
  buildAvailabilityIntervals,
  getRestaurantDayWindow,
  parseDateQuery
} from '../utils/reservationTime';

const parsePositiveInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getAuthUser = (req: Request) => req.authUser ?? extractAuthUser(req);

export const getAll = async (req: Request, res: Response) => {
  const { tag, neighborhood } = (req.query ?? {}) as {
    tag?: string | string[];
    neighborhood?: string | string[];
  };
  const normalizedTag = Array.isArray(tag) ? tag[0] : tag;
  const normalizedNeighborhood = Array.isArray(neighborhood)
    ? neighborhood[0]
    : neighborhood;

  let query = `
    SELECT r.id, r.name, r.latitude, r.longitude, r.description, r.seats_total, r.neighborhood,
           (r.seats_total / 2)::int AS tables_total,
           COALESCE(
             json_agg(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
             '[]'
           ) AS tags
    FROM restaurants r
    LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
    LEFT JOIN tags t ON rt.tag_id = t.id
  `;

  const conditions: string[] = [];
  const params: string[] = [];

  if (normalizedTag) {
    conditions.push(`t.name = $${params.length + 1}`);
    params.push(normalizedTag);
  }

  if (normalizedNeighborhood) {
    conditions.push(`r.neighborhood = $${params.length + 1}`);
    params.push(normalizedNeighborhood);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' GROUP BY r.id ORDER BY r.name ASC';

  try {
    const { rows } = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return res.status(500).json({ error: 'Error al obtener restaurantes' });
  }
};

export const getById = async (req: Request, res: Response) => {
  const restaurantId = parsePositiveInteger(req.params.id);
  if (!restaurantId) {
    return res.status(400).json({ error: 'Restaurant id is invalid.' });
  }

  try {
    const { rows } = await db.query(
      `SELECT r.id, r.name, r.latitude, r.longitude, r.description, r.phone, r.email, r.address,
              r.seats_total, r.neighborhood, (r.seats_total / 2)::int AS tables_total,
              COALESCE(
                json_agg(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL),
                '[]'
              ) AS tags
       FROM restaurants r
       LEFT JOIN restaurant_tags rt ON r.id = rt.restaurant_id
       LEFT JOIN tags t ON rt.tag_id = t.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [restaurantId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching restaurant by id:', error);
    return res.status(500).json({ error: 'Error al obtener restaurante' });
  }
};

export const getAvailability = async (req: Request, res: Response) => {
  const restaurantId = parsePositiveInteger(req.params.id);
  const date = req.query.date as string | undefined;

  if (!restaurantId) {
    return res.status(400).json({ error: 'Restaurant id is invalid.' });
  }

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required' });
  }

  const parsedDate = parseDateQuery(date);
  if (!parsedDate) {
    return res.status(400).json({ error: 'Date must use YYYY-MM-DD format.' });
  }

  try {
    const intervals = buildAvailabilityIntervals(parsedDate);
    const { rows: restaurantRows } = await db.query(
      'SELECT seats_total FROM restaurants WHERE id = $1',
      [restaurantId]
    );

    if (!restaurantRows.length) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const tablesTotal = Math.floor(restaurantRows[0].seats_total / 2);
    const { dateStart, dateEnd } = getRestaurantDayWindow(parsedDate);

    const { rows: reservationRows } = await db.query(
      `SELECT reservation_at, guests
       FROM reservations
       WHERE restaurant_id = $1
         AND status IN ('pending', 'confirmed')
         AND reservation_at + INTERVAL '90 minutes' > $2
         AND reservation_at < $3`,
      [restaurantId, dateStart, dateEnd]
    );

    const now = Date.now();
    const availability = intervals
      .map(({ start, end }) => {
        const usedTables = reservationRows.reduce((sum: number, row: any) => {
          const reservationStart = new Date(row.reservation_at).getTime();
          const reservationEnd = reservationStart + RESERVATION_DURATION_MS;

          if (reservationStart < end && reservationEnd > start) {
            return sum + Math.ceil(row.guests / 2);
          }

          return sum;
        }, 0);

        return {
          start,
          available_tables: Math.max(tablesTotal - usedTables, 0)
        };
      })
      .filter((slot) => slot.start >= now || dateStart.getTime() > now);

    return res.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return res.status(500).json({ error: 'Error al obtener disponibilidad' });
  }
};

export const getRestaurantReservations = async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'restaurant' || !authUser.restaurant_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { rows } = await db.query(
      `SELECT r.*, u.name AS user_name, u.email AS user_email
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.restaurant_id = $1
       ORDER BY r.reservation_at DESC`,
      [authUser.restaurant_id]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching restaurant reservations:', error);
    return res.status(500).json({ error: 'Error al obtener las reservas' });
  }
};

export const confirmPresence = async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser || authUser.role !== 'restaurant' || !authUser.restaurant_id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const reservationId = parsePositiveInteger(req.params.id);
  if (!reservationId) {
    return res.status(400).json({ error: 'Reservation id is invalid.' });
  }

  const { present } = req.body;
  if (typeof present !== 'boolean') {
    return res
      .status(400)
      .json({ error: 'El cuerpo de la solicitud debe incluir un campo "present" booleano.' });
  }

  try {
    const { rows } = await db.query(
      'SELECT id FROM reservations WHERE id = $1 AND restaurant_id = $2',
      [reservationId, authUser.restaurant_id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const newStatus = present ? 'confirmed' : 'no-show';
    await db.query(
      `UPDATE reservations
       SET presence_confirmed = $1,
           presence_confirmed_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END,
           status = $2
       WHERE id = $3`,
      [present, newStatus, reservationId]
    );

    io.to(`restaurant_${authUser.restaurant_id}`).emit('reservation_updated', {
      reservation_id: reservationId,
      presence_confirmed: present,
      status: newStatus
    });

    return res.json({
      message: present ? 'Presencia confirmada' : 'Ausencia confirmada'
    });
  } catch (error) {
    console.error('Error confirming presence/absence:', error);
    return res.status(500).json({ error: 'Error al confirmar presencia/ausencia' });
  }
};
