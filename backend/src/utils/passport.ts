import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db';
import dotenv from 'dotenv';
dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
  const email     = profile.emails?.[0].value;
  const google_id = profile.id;
  const name      = profile.displayName || '';

  // upsert guardando también el nombre
  const { rows } = await db.query(
    `INSERT INTO users (google_id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (google_id)
     DO UPDATE SET
       email = EXCLUDED.email,
       name  = EXCLUDED.name
     RETURNING *`,
    [google_id, email, name]
  );

  return done(null, rows[0]);
}));

passport.serializeUser((user: any, done: (err: any, id?: any) => void) =>
  done(null, user.id)
);

passport.deserializeUser(async (id: number, done: (err: any, user?: any) => void) => {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  done(null, rows[0]);
});

