import { Request, Response } from 'express';
import {
  getAll,
  getAvailability,
  getById
} from '../src/controllers/restaurants.controller';
import { db } from '../src/db';

jest.mock('../src/db');

const createMockResponse = () => {
  const response: Partial<Response> = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  return response as Response;
};

describe('Restaurants controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns all restaurants ordered by the query result', async () => {
    const res = createMockResponse();
    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        { id: 1, name: 'Alquimista', tags: ['Bar'] },
        { id: 2, name: 'Charo', tags: ['Cafe'] }
      ]
    });

    await getAll({ query: {} } as Request, res);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY r.name ASC'), []);
    expect(res.json).toHaveBeenCalledWith([
      { id: 1, name: 'Alquimista', tags: ['Bar'] },
      { id: 2, name: 'Charo', tags: ['Cafe'] }
    ]);
  });

  it('rejects invalid restaurant ids on getById', async () => {
    const res = createMockResponse();

    await getById({ params: { id: 'abc' } } as unknown as Request, res);

    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns restaurant detail with tags', async () => {
    const res = createMockResponse();
    (db.query as jest.Mock).mockResolvedValue({
      rows: [
        {
          id: 1,
          name: 'Alquimista',
          neighborhood: 'Carrasco',
          tags: ['Bar', 'Parrilla']
        }
      ]
    });

    await getById({ params: { id: '1' } } as unknown as Request, res);

    expect(res.json).toHaveBeenCalledWith({
      id: 1,
      name: 'Alquimista',
      neighborhood: 'Carrasco',
      tags: ['Bar', 'Parrilla']
    });
  });

  it('rejects malformed dates on getAvailability', async () => {
    const res = createMockResponse();

    await getAvailability(
      {
        params: { id: '1' },
        query: { date: '06/10/2030' }
      } as unknown as Request,
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Date must use YYYY-MM-DD format.' });
  });

  it('clamps availability to zero when reservations exceed table count', async () => {
    const res = createMockResponse();
    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ seats_total: 2 }] })
      .mockResolvedValueOnce({
        rows: [{ reservation_at: '2030-06-10T13:00:00.000Z', guests: 8 }]
      });

    await getAvailability(
      {
        params: { id: '1' },
        query: { date: '2030-06-10' }
      } as unknown as Request,
      res
    );

    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          available_tables: 0
        })
      ])
    );
  });
});
