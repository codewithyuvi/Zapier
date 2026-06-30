import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// We just point it to the .env in the parent directory
dotenv.config({ path: '../.env' });

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});