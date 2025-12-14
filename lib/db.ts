import "server-only";
import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    password: String,
    admin: Boolean,
})

if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI not found");

export const User = mongoose.model("User", userSchema);
const db = await mongoose.connect(process.env.MONGODB_URI);
export default db;
