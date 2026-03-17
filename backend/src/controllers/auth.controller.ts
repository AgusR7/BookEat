import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import {
  AuthTokenPayload,
  createAuthToken,
  extractAuthUser
} from '../utils/auth';
import { validatePassword } from '../utils/validation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$/;

const normalizeEmail = (value: unknown) => String(value ?? '').trim().toLowerCase();
const normalizeName = (value: unknown) => String(value ?? '').trim();
const normalizePassword = (value: unknown) => String(value ?? '');

const sanitizeAuthPayload = (payload: AuthTokenPayload): AuthTokenPayload => ({
  ...payload,
  role: payload.role === 'customer' ? 'user' : payload.role
});

export const register = async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body.email);
  const password = normalizePassword(req.body.password);
  const name = normalizeName(req.body.name);

  if (!name) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'El email no es valido' });
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ error: passwordValidation.error });
  }

  try {
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya esta registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await db.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, 'user']
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error in register:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body.email);
  const password = normalizePassword(req.body.password);

  if (!EMAIL_PATTERN.test(email) || !password) {
    return res
      .status(400)
      .json({ error: 'Debes ingresar email y contrasena validos' });
  }

  try {
    const result = await db.query(
      `SELECT *
       FROM users
       WHERE email = $1
         AND role IN ('user', 'customer')`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, String(user.password ?? ''));

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    return req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session during login:', err);
        return res.status(500).json({ error: 'Error al iniciar sesion' });
      }

      const payload = sanitizeAuthPayload({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      });

      req.session.user = payload;
      const token = createAuthToken(payload);

      return res.json({
        token,
        user: payload
      });
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesion' });
  }
};

export const restaurantLogin = async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body.email);
  const password = normalizePassword(req.body.password);

  if (!EMAIL_PATTERN.test(email) || !password) {
    return res
      .status(400)
      .json({ error: 'Debes ingresar email y contrasena validos' });
  }

  try {
    const userResult = await db.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2',
      [email, 'restaurant']
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const user = userResult.rows[0];
    const storedPassword = String(user.password ?? '');

    let isValidPassword = false;
    if (BCRYPT_HASH_PATTERN.test(storedPassword)) {
      isValidPassword = await bcrypt.compare(password, storedPassword);
    } else if (password === storedPassword) {
      isValidPassword = true;

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await db.query('UPDATE users SET password = $1 WHERE id = $2', [
        hashedPassword,
        user.id
      ]);
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const restaurantResult = await db.query(
      'SELECT id FROM restaurants WHERE id = $1',
      [user.restaurant_id]
    );

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    return req.session.regenerate((err) => {
      if (err) {
        console.error('Error regenerating session during restaurant login:', err);
        return res.status(500).json({ error: 'Error al iniciar sesion' });
      }

      const payload = sanitizeAuthPayload({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurant_id: user.restaurant_id
      });

      req.session.restaurant = payload as AuthTokenPayload & { restaurant_id: number };
      const token = createAuthToken(payload);

      return res.json({
        token,
        user: payload
      });
    });
  } catch (error) {
    console.error('Error in restaurant login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesion' });
  }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Error al cerrar sesion' });
      }

      res.clearCookie('connect.sid', { path: '/' });
      return res.status(200).json({ message: 'Sesion cerrada' });
    });
    return;
  }

  if (req.logout) {
    req.logout((err) => {
      if (err) {
        return next(err);
      }

      req.session?.destroy((sessionErr) => {
        res.clearCookie('connect.sid', { path: '/' });
        return sessionErr ? res.sendStatus(500) : res.sendStatus(200);
      });
    });
    return;
  }

  res.status(200).json({ message: 'No session to close' });
};

export const getMe = async (req: Request, res: Response) => {
  const authUser = extractAuthUser(req);
  if (authUser) {
    return res.json(sanitizeAuthPayload(authUser));
  }

  return res.status(401).json({ error: 'No autenticado' });
};
