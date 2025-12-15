import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import db from "./db";
import { username } from "better-auth/plugins";

export const auth = betterAuth({
  database: mongodbAdapter(db.connection),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 1,
  },
  plugins: [username()],
  baseURL: "http://localhost:3000"
})

const DEFAULT_USERS = [
  { username: "valor", email: "valor@gmail.com", name: "Valor", password: "6800" },
  { username: "ftc", email: "ftc@gmail.com", name: "FTC", password: "viperbots" }
]
for (const user of DEFAULT_USERS) {
  try {
    await auth.api.signUpEmail({ body: user });
  } catch (err) { }
}