import 'express-serve-static-core';
import type { AuthTokenPayload } from '../utils/auth';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: AuthTokenPayload;
    isAuthenticated(): boolean;
    logout(callback: (err: any) => void): void;
    user?: any;
  }
}
