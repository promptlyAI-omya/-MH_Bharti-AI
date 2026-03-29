import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

export const sql = connectionString
  ? neon(connectionString)
  : (() => {
      throw new Error("DATABASE_URL is not set. Add it to .env.local and restart the dev server.");
    });
