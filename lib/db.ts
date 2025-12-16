import "server-only";
import mongoose from "mongoose";

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

export const MTSession = mongoose.models.MTSession || mongoose.model("MTSession", new mongoose.Schema({
  material: String,
  thickness: Number,
  assignments: [{
    plateId: String,
    parts: [{
      id: String,
      quantity: Number
    }]
  }],
  plates: [{
    id: String,
    Width: Number,
    Length: Number,
    trueDepth: Number,
    verifiedSignature: String,
    cam_download_url: String,
    cam_bundle_rel: String,
    screenshot_url: String
  }],
  selected_parts: [{
    id: String,
    quantity: Number
  }],
  updatedAt: String,
  updatedBy: String,
}, { collection: "mt_sessions" }))

if (!process.env.MONGODB_URI)
  throw new Error("MONGODB_URI not found");

const db = await mongoose.connect(process.env.MONGODB_URI, { dbName: "jira" });
export default db;
