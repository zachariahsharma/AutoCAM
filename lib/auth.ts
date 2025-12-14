import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import db from "./db";

export const auth = betterAuth({
    database: mongodbAdapter(db.connection),
    emailAndPassword: { enabled: true },
})