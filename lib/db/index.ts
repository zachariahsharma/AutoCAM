import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchemas from "./schema/auth";
import * as camSchemas from './schema/auth';
import * as entitiesSchemas from './schema/entities';
import { AuthType } from "../auth/server";

const db = drizzle(process.env.DATABASE_URL!, {
  schema: { ...authSchemas, ...camSchemas, ...entitiesSchemas },
});

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Wrapper to ensure RLS functions correctly
export async function withAuth<T>(auth: AuthType, fn: (tx: Transaction) => Promise<T>) {
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
