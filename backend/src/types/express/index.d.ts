declare module 'passport';
declare module 'passport-google-oauth20';
declare module 'express-session';
declare module 'pg';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      isAuthenticated(): boolean;
      login(user: any, callback: (err: any) => void): void;
    }
  }
}
