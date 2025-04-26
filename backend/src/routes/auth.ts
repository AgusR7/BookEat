// backend/src/routes/auth.ts
import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = Router();

// 1. Inicio de OAuth con Google
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 2. Callback de Google
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    // Redirect to frontend after successful login
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  }
);

// 3. Endpoint para obtener el usuario autenticado
router.get(
  '/me',
  (req: Request, res: Response) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      const { id, email, role } = req.user as any;
      res.json({ id, email, role });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  }
);

// 4. Ruta para cerrar sesión (logout)
router.post(
  '/logout',
  (req: Request, res: Response, next: NextFunction) => {
    // Passport >=0.6: logout es asíncrono y usa callback
    req.logout(err => {
      if (err) return next(err);
      // Destruye la sesión en el servidor
      req.session?.destroy(sessionErr => {
        // Limpia la cookie de sesión en el cliente
        res.clearCookie('connect.sid', { path: '/' });
        // Envía respuesta al frontend
        return sessionErr ? res.sendStatus(500) : res.sendStatus(200);
      });
    });
  }
);

export default router;
