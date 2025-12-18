import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchemas from "./schema/cam";
import * as camSchemas from './schema/auth';
import * as entitiesSchemas from './schema/entities';

const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...authSchemas, ...camSchemas, ...entitiesSchemas }
});

export default db;
