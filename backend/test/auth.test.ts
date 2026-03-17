import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import {
  getMe,
  login,
  logout,
  register,
  restaurantLogin
} from '../src/controllers/auth.controller';
import { db } from '../src/db';
import { createAuthToken, extractAuthUser } from '../src/utils/auth';
import { validatePassword } from '../src/utils/validation';

jest.mock('../src/db');
jest.mock('bcrypt');
jest.mock('../src/utils/validation');
jest.mock('../src/utils/auth', () => ({
  createAuthToken: jest.fn(() => 'mocked-token'),
  extractAuthUser: jest.fn()
}));

const createMockResponse = () => {
  const response: Partial<Response> = {};
  response.status = jest.fn().mockReturnValue(response);
  response.json = jest.fn().mockReturnValue(response);
  response.clearCookie = jest.fn().mockReturnValue(response);
  response.sendStatus = jest.fn().mockReturnValue(response);
  return response as Response;
};

describe('Auth controller', () => {
  let req: Partial<Request>;
  let res: Response;

  beforeEach(() => {
    jest.clearAllMocks();
    (validatePassword as jest.Mock).mockReturnValue({ isValid: true });
    req = {
      body: {},
      session: {
        regenerate: jest.fn((callback) => callback()),
        destroy: jest.fn((callback) => callback())
      } as any
    };
    res = createMockResponse();
  });

  describe('register', () => {
    it('creates a new user with normalized data', async () => {
      req.body = {
        name: '  Maria Lopez ',
        email: ' MARIA@Example.com ',
        password: 'Secure!123'
      };

      (db.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ id: 1, email: 'maria@example.com', name: 'Maria Lopez', role: 'user' }]
        });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await register(req as Request, res);

      expect(db.query).toHaveBeenNthCalledWith(1, 'SELECT id FROM users WHERE email = $1', [
        'maria@example.com'
      ]);
      expect(db.query).toHaveBeenNthCalledWith(
        2,
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        ['maria@example.com', 'hashed-password', 'Maria Lopez', 'user']
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('rejects invalid emails before hitting the database', async () => {
      req.body = { name: 'Test', email: 'bad-email', password: 'Secure!123' };

      await register(req as Request, res);

      expect(db.query).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El email no es valido' });
    });
  });

  describe('login', () => {
    it('returns a token and sanitizes customer role to user', async () => {
      req.body = {
        email: 'cliente@example.com',
        password: 'Secure!123'
      };
      (db.query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 5,
            email: 'cliente@example.com',
            name: 'Cliente Uno',
            password: 'hashed-password',
            role: 'customer'
          }
        ]
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await login(req as Request, res);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining("role IN ('user', 'customer')"),
        ['cliente@example.com']
      );
      expect(createAuthToken).toHaveBeenCalledWith({
        id: 5,
        email: 'cliente@example.com',
        name: 'Cliente Uno',
        role: 'user'
      });
      expect((req.session as any).user).toEqual({
        id: 5,
        email: 'cliente@example.com',
        name: 'Cliente Uno',
        role: 'user'
      });
      expect(res.json).toHaveBeenCalledWith({
        token: 'mocked-token',
        user: {
          id: 5,
          email: 'cliente@example.com',
          name: 'Cliente Uno',
          role: 'user'
        }
      });
    });
  });

  describe('restaurantLogin', () => {
    it('upgrades plain-text passwords after a successful login', async () => {
      req.body = {
        email: 'restaurant@example.com',
        password: 'plaintext-secret'
      };
      (db.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [
            {
              id: 8,
              email: 'restaurant@example.com',
              name: 'Restaurant Demo',
              password: 'plaintext-secret',
              role: 'restaurant',
              restaurant_id: 3
            }
          ]
        })
        .mockResolvedValueOnce({ rows: [{ id: 3 }] });
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-upgraded-password');

      await restaurantLogin(req as Request, res);

      expect(db.query).toHaveBeenNthCalledWith(
        2,
        'UPDATE users SET password = $1 WHERE id = $2',
        ['hashed-upgraded-password', 8]
      );
      expect(res.json).toHaveBeenCalledWith({
        token: 'mocked-token',
        user: {
          id: 8,
          email: 'restaurant@example.com',
          name: 'Restaurant Demo',
          role: 'restaurant',
          restaurant_id: 3
        }
      });
    });
  });

  describe('logout', () => {
    it('destroys the session and clears the cookie', () => {
      logout(req as Request, res, jest.fn());

      expect(req.session?.destroy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('connect.sid', { path: '/' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getMe', () => {
    it('returns the authenticated user with sanitized role', async () => {
      (extractAuthUser as jest.Mock).mockReturnValue({
        id: 2,
        email: 'customer@example.com',
        name: 'Customer',
        role: 'customer'
      });

      await getMe(req as Request, res);

      expect(res.json).toHaveBeenCalledWith({
        id: 2,
        email: 'customer@example.com',
        name: 'Customer',
        role: 'user'
      });
    });
  });
});
