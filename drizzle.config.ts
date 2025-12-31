import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './lib/db/schema/*',
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.ADMIN_DB_URL!,
  }
});