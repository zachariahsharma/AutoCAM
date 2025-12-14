import "server-only";
import mongoose from "mongoose";
import { hash } from "argon2";

export const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    password: String,
    admin: Boolean,
}));

export const Task = mongoose.models.Task || mongoose.model("Task", new mongoose.Schema({
    Material: String,
    Thickness: Number,
    Parts: [String],
    Status: String,
    name: String,
}));

export const Imported = mongoose.models.Imported || mongoose.model("Imported", new mongoose.Schema({
    child: String,
    quantity: String,
    name: String,
    epic: String,
}, { collection: "imported" }))

const DEFAULT_USERS = [
    { email: "valor", password: await hash("6800"), admin: true },
    { email: "ftc", password: await hash("viperbots"), admin: false }
]

if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI not found");

const db = await mongoose.connect(process.env.MONGODB_URI, { dbName: "jira" });
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
