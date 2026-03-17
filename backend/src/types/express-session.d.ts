import 'express-session';

interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'customer' | 'restaurant';
  picture?: string | null;
}

interface RestaurantSession extends SessionUser {
  restaurant_id: number;
}

declare module 'express-session' {
  interface SessionData {
    user?: SessionUser;
    restaurant?: RestaurantSession;
  }
}
