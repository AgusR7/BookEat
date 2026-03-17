import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type AuthRole = 'user' | 'customer' | 'restaurant';

export interface AuthTokenPayload {
  id: number;
  email: string;
  name: string;
  role: AuthRole;
  restaurant_id?: number;
  picture?: string | null;
}

const JWT_SECRET =
  process.env.JWT_SECRET || '73aacc7a-9603-4e93-94b8-b91b19f06397';

const hasStringValue = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const normalizeRole = (role: unknown): AuthRole => {
  if (role === 'restaurant') {
    return 'restaurant';
  }

  if (role === 'customer') {
    return 'customer';
  }

  return 'user';
};

const normalizePayload = (payload: Partial<AuthTokenPayload>): AuthTokenPayload => ({
  id: Number(payload.id),
  email: String(payload.email || ''),
  name: String(payload.name || ''),
  role: normalizeRole(payload.role),
  ...(payload.restaurant_id ? { restaurant_id: Number(payload.restaurant_id) } : {}),
  ...(payload.picture !== undefined ? { picture: payload.picture } : {})
});

const isAuthPayload = (value: unknown): value is AuthTokenPayload => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AuthTokenPayload>;
  return (
    Number.isInteger(Number(candidate.id)) &&
    hasStringValue(candidate.email) &&
    hasStringValue(candidate.name) &&
    ['user', 'customer', 'restaurant'].includes(String(candidate.role))
  );
};

const getSessionAuthUser = (req: Request) => {
  if (req.session?.restaurant) {
    return normalizePayload(req.session.restaurant);
  }

  if (req.session?.user) {
    return normalizePayload(req.session.user);
  }

  return undefined;
};

const getPassportAuthUser = (req: Request) => {
  if (typeof req.isAuthenticated !== 'function' || !req.isAuthenticated() || !req.user) {
    return undefined;
  }

  const passportUser = req.user as Partial<AuthTokenPayload>;
  return normalizePayload({
    id: passportUser.id,
    email: passportUser.email,
    name: passportUser.name,
    role: passportUser.role || 'customer',
    restaurant_id: passportUser.restaurant_id,
    picture: passportUser.picture
  });
};

const getBearerAuthUser = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return undefined;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return undefined;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isAuthPayload(decoded)) {
      return undefined;
    }

    return normalizePayload(decoded);
  } catch {
    return undefined;
  }
};

export const createAuthToken = (payload: AuthTokenPayload) =>
  jwt.sign(normalizePayload(payload), JWT_SECRET, { expiresIn: '7d' });

export const extractAuthUser = (req: Request) =>
  getSessionAuthUser(req) ?? getPassportAuthUser(req) ?? getBearerAuthUser(req);

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authUser = extractAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.authUser = authUser;
  return next();
}
