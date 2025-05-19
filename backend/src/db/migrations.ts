import { db } from '../db';

export async function runMigrations() {
  try {
    // Add password and name columns if they don't exist
    await db.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') THEN
          ALTER TABLE users ADD COLUMN password VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
          ALTER TABLE users ADD COLUMN name VARCHAR(120);
        END IF;

        -- Update the constraint
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'users' AND constraint_name = 'auth_method'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT auth_method CHECK (
            (google_id IS NOT NULL AND password IS NULL) OR
            (google_id IS NULL AND password IS NOT NULL)
          );
        END IF;
      END $$;
    `);

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
} 