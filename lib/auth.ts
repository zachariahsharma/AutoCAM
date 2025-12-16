import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import db from "./db";

export const auth = betterAuth({
  database: mongodbAdapter(db.connection),
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
  } catch (err) { }
}