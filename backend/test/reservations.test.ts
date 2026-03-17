import { Request, Response } from 'express';
import {
  createReservation,
  deleteReservation,
  getReservations
} from '../src/controllers/reservations.controller';
import { db } from '../src/db';
import {
  sendReservationCancellationEmail,
  sendReservationConfirmationEmail
} from '../src/utils/mailer';
import { newReservationsCounter } from '../src/metrics/prometheus';
import { io } from '../src/sockets/occupancySocket';

jest.mock('../src/db');
jest.mock('../src/utils/mailer');
jest.mock('../src/metrics/prometheus', () => ({
  newReservationsCounter: {
    inc: jest.fn()
  }
}));
jest.mock('../src/sockets/occupancySocket', () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  }
}));

const createMockResponse = () => {
  const response: Partial<Response> = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response as Response;
};

describe('Reservations controller', () => {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (db.connect as jest.Mock).mockResolvedValue(mockClient);
    mockClient.query.mockReset();
    mockClient.release.mockReset();
  });

  it('creates a reservation inside a transaction and emits updates', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    future.setUTCHours(18, 0, 0, 0);

    const req = {
      body: {
        restaurant_id: 4,
        reservation_at: future.getTime(),
        guests: 3
      },
      authUser: {
        id: 10,
        email: 'user@example.com',
        name: 'User Demo',
        role: 'user'
      }
    } as Partial<Request>;
    const res = createMockResponse();

    mockClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ seats_total: 40, name: 'Demo Restaurant' }] })
      .mockResolvedValueOnce({ rows: [{ used_tables: 4 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 99,
            user_id: 10,
            restaurant_id: 4,
            reservation_at: future.toISOString(),
            requested_guests: 3,
            guests: 4,
            status: 'pending',
            presence_confirmed: false,
            presence_confirmed_at: null
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [] });

    await createReservation(req as Request, res);

    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(
      2,
      'SELECT seats_total, name FROM restaurants WHERE id = $1 FOR UPDATE',
      [4]
    );
    expect(mockClient.query).toHaveBeenNthCalledWith(5, 'COMMIT');
    expect(sendReservationConfirmationEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Demo Restaurant',
      3,
      future.getTime()
    );
    expect(newReservationsCounter.inc).toHaveBeenCalledWith({
      restaurant_id: '4',
      restaurant_name: 'Demo Restaurant'
    });
    expect(io.to).toHaveBeenCalledWith('restaurant_4');
    expect(io.emit).toHaveBeenCalledWith(
      'new_reservation',
      expect.objectContaining({
        reservation: expect.objectContaining({ id: 99, user_name: 'User Demo' })
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('rejects invalid guest counts before hitting the database', async () => {
    const req = {
      body: {
        restaurant_id: 4,
        reservation_at: Date.now() + 60_000,
        guests: 0
      },
      authUser: {
        id: 10,
        email: 'user@example.com',
        name: 'User Demo',
        role: 'user'
      }
    } as Partial<Request>;
    const res = createMockResponse();

    await createReservation(req as Request, res);

    expect(db.connect).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns user reservations sorted by date', async () => {
    const req = {
      authUser: {
        id: 10,
        email: 'user@example.com',
        name: 'User Demo',
        role: 'user'
      }
    } as Partial<Request>;
    const res = createMockResponse();

    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          id: 2,
          restaurant_id: 9,
          restaurant_name: 'B Restaurant',
          reservation_at: '2030-06-03T21:00:00.000Z',
          requested_guests: 2,
          guests: 2,
          status: 'pending'
        },
        {
          id: 1,
          restaurant_id: 8,
          restaurant_name: 'A Restaurant',
          reservation_at: '2030-06-01T21:00:00.000Z',
          requested_guests: 4,
          guests: 4,
          status: 'confirmed'
        }
      ]
    });

    await getReservations(req as Request, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ id: 2 })
    ]);
  });

  it('cancels a reservation transactionally and emits occupancy changes', async () => {
    const req = {
      params: { id: '12' },
      authUser: {
        id: 10,
        email: 'user@example.com',
        name: 'User Demo',
        role: 'user'
      }
    } as Partial<Request>;
    const res = createMockResponse();

    mockClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            restaurant_id: 4,
            requested_guests: 2,
            reservation_at: '2030-06-01T21:00:00.000Z',
            restaurant_name: 'Demo Restaurant'
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    await deleteReservation(req as Request, res);

    expect(mockClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(mockClient.query).toHaveBeenNthCalledWith(3, 'DELETE FROM reservations WHERE id = $1', [
      12
    ]);
    expect(mockClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(sendReservationCancellationEmail).toHaveBeenCalled();
    expect(io.emit).toHaveBeenCalledWith('occupancy_update', { restaurant_id: 4 });
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
