import { betterAuth } from "better-auth";
import db from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from '../auth-schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema }
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 1,
  },
  baseURL: "http://localhost:3000"
})

const DEFAULT_USERS = [
  { email: "valor@gmail.com", name: "Valor", password: "6800" },
  { email: "ftc@gmail.com", name: "FTC", password: "viperbots" }
]
for (const user of DEFAULT_USERS) {
  try {
    await auth.api.signUpEmail({ body: user });
  } catch { }
}