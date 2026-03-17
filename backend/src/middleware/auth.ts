import { NextFunction, Request, Response } from 'express';

export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user || req.session.restaurant) {
    return next();
  }

  return res.status(401).json({ error: 'No autenticado' });
};

export const ensureUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.user && ['user', 'customer'].includes(req.session.user.role)) {
    return next();
  }

  return res.status(403).json({ error: 'Acceso denegado' });
};

export const ensureRestaurant = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.restaurant && req.session.restaurant.role === 'restaurant') {
    return next();
  }

  return res.status(403).json({ error: 'Acceso denegado' });
};
