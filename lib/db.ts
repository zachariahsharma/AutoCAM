import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchemas from "./schema/cam";
import * as camSchemas from './schema/auth';
import * as entitiesSchemas from './schema/entities';
import { sql } from "drizzle-orm";
import { AuthType } from "./auth";

const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...authSchemas, ...camSchemas, ...entitiesSchemas }
});

// Wrapper to ensure RLS functions correctly
export async function withAuth<T>(auth: AuthType, fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>) {
  // TODO: Switch to binary/bytea if better-auth supports a higher drizzle version that adds the bytea PG type
  // FIXME: Use proper SQL escaping - this looks a lot like SQL injection
  if (auth.userId) {
    return await db.transaction(async tx => {
      await tx.execute(`SET LOCAL app.user_id = '${auth.userId}';`);
      return fn(tx);
    })
  } else if (auth.keyDigest) {
    return await db.transaction(async tx => {
      await tx.execute(`SET LOCAL app.key_digest = '${auth.keyDigest}';`);
      return fn(tx);
    });
  }
  throw new Error("No valid authorization");
}

export default db;
