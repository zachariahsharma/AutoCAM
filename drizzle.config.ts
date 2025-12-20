import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './lib/schema/*',
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    password: process.env.DB_PASSWORD!,
  }
});