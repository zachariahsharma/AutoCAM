import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchemas from "./schema/cam";
import * as camSchemas from './schema/auth';
import * as entitiesSchemas from './schema/entities';
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...authSchemas, ...camSchemas, ...entitiesSchemas }
});

// Wrapper to ensure RLS functions correctly
export async function withUser<T>(id: string, fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>) {
  return await db.transaction(async tx => {
    await tx.execute(sql`SET LOCAL app.user_id = ${id}`);
    return fn(tx);
  })
}

export default db;
