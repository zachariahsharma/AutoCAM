import "server-only";
import mongoose from "mongoose";
import { hash } from "./auth";

export const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    password: String,
    admin: Boolean,
})
export const User = mongoose.model("User", userSchema);

const DEFAULT_USERS = [
    { email: "valor", password: await hash("6800"), admin: true },
    { email: "ftc", password: await hash("viperbots"), admin: false }
]

if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI not found");

const db = await mongoose.connect(process.env.MONGODB_URI);
await User.bulkWrite(DEFAULT_USERS.map(user => {
    return {
        updateOne: {
            filter: { email: user.email },
            update: { $set: user },
            upsert: true,
        }
    }
}))
export default db;
