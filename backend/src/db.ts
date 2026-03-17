import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const resolveConnectionString = () => {
  const host = process.env.DB_HOST?.trim();
  const port = process.env.DB_PORT?.trim() || '5432';
  const database = process.env.DB_NAME?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? '';

  // Prefer explicit DB_* variables when present so Docker Compose overrides
  // do not get shadowed by a stale DATABASE_URL from the mounted .env file.
  if (host && database && user) {
    return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  return process.env.DATABASE_URL;
};

export const db = new Pool({
  connectionString: resolveConnectionString()
});
