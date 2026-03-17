import { Request, Response, Router } from 'express';
import passport from 'passport';
import { getMe, login, logout, register, restaurantLogin } from '../controllers/auth.controller';
import { AuthTokenPayload, createAuthToken } from '../utils/auth';

const router = Router();
const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

router.post('/register', register);
router.post('/login', login);
router.post('/restaurant/login', restaurantLogin);
router.get('/me', getMe);
router.post('/logout', logout);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: frontendBaseUrl }),
  (req: Request, res: Response) => {
    const user = req.user as Partial<AuthTokenPayload> | undefined;
    if (!user) {
      return res.redirect(frontendBaseUrl);
    }

    const payload: AuthTokenPayload = {
      id: Number(user.id),
      email: String(user.email || ''),
      name: String(user.name || ''),
      role: 'user',
      ...(user.picture !== undefined ? { picture: user.picture } : {})
    };

    req.session.user = payload;
    const token = createAuthToken(payload);
    const redirectUrl = new URL('/', frontendBaseUrl);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('redirect', '/map');

    return res.redirect(redirectUrl.toString());
  }
);

export default router;
