import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchemas from "./schema/auth";
import * as camSchemas from './schema/cam';
import * as entitiesSchemas from './schema/entities';

const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...authSchemas, ...camSchemas, ...entitiesSchemas },
});

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export default db;
