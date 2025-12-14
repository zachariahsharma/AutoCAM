import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import db from "./db";

export const auth = betterAuth({
    database: mongodbAdapter(db.connection),
    emailAndPassword: { enabled: true },
    baseURL: "http://localhost:3000"
})

const DEFAULT_USERS = [
    { email: "valor", name: "valor", password: "6800", data: { admin: true } },
    { email: "ftc", name: "ftc", password: "viperbots", data: { admin: false } }
]
for (const user of DEFAULT_USERS) {
    await auth.api.signUpEmail({ body: user });
}