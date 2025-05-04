import {getById} from "../src/controllers/restaurants.controller"
import { getAll } from '../src/controllers/restaurants.controller';
import { db } from '../src/db';
import { Request, Response } from 'express';
// Mockear la base de datos
jest.mock('../src/db'); // Mockear la base de datos


// Definir el restaurante como una constante
const testRestaurants = [
    {
      id: 1,
      name: 'Café Brasilero',
      latitude: -34.90757,
      longitude: -56.20312,
      description: 'Café histórico con ambiente bohemio',
      seats_total: 40,
      tables_total: 20
    },
    {
      id: 2,
      name: 'La Pasiva',
      latitude: -34.90310,
      longitude: -56.18816,
      description: 'Parrillada tradicional uruguaya',
      seats_total: 60,
      tables_total: 30
    }
  ];
  

describe('getById (con mocks)', () => {
  const mockRequest = (params: any): Partial<Request> => ({ params });
  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('debería devolver un restaurante si existe', async () => {
    const req = mockRequest({ id: '1' }) as Request;
    const res = mockResponse() as Response;

    // Simular el resultado del query
    (db.query as jest.Mock).mockResolvedValue({ rows: [testRestaurants] });

    await getById(req, res);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['1']);
    expect(res.json).toHaveBeenCalledWith(testRestaurants);
  });

  it('debería devolver 404 si no se encuentra el restaurante', async () => {
    const req = mockRequest({ id: '999' }) as Request;
    const res = mockResponse() as Response;

    (db.query as jest.Mock).mockResolvedValue({ rows: [] });

    await getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Restaurant not found' });
  });
});

describe('getAll (con mocks)', () => {
    const mockResponse = (): Partial<Response> => {
      const res: Partial<Response> = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };
  
    it('debería devolver todos los restaurantes', async () => {
      const res = mockResponse() as Response;
  
      (db.query as jest.Mock).mockResolvedValue({ rows: testRestaurants });
  
      await getAll({} as Request, res);
  
      expect(db.query).toHaveBeenCalledWith(expect.any(String));
      expect(res.json).toHaveBeenCalledWith(testRestaurants);
    });

    

  });