const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/org_store";

const roleSchema = new mongoose.Schema({
  name: { type: String, enum: ["user", "admin"], default: "user" },
  description: { type: String, default: null },
  permissions: [{ type: String }],
});
const Role = mongoose.model("Roles", roleSchema, "roles");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Roles", required: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
});
const User = mongoose.model("User", userSchema, "users");

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Ensure admin role exists
  let adminRole = await Role.findOne({ name: "admin" });
  if (!adminRole) {
    adminRole = await Role.create({
      name: "admin",
      description: "Administrator with full access",
      permissions: ["admin|*|*"],
    });
    console.log("Created admin role:", adminRole._id);
  } else {
    console.log("Admin role already exists:", adminRole._id);
  }

  // Ensure regular user role exists
  let userRole = await Role.findOne({ name: "user" });
  if (!userRole) {
    userRole = await Role.create({
      name: "user",
      description: "Regular customer",
      permissions: ["user|profile|read", "user|profile|write"],
    });
    console.log("Created user role:", userRole._id);
  } else {
    console.log("User role already exists:", userRole._id);
  }

  // Create admin user if not exists
  const adminEmail = "admin@organicstore.com";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const hashed = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "Admin",
      email: adminEmail,
      mobile: "9999999999",
      password: hashed,
      role: adminRole._id,
      isActive: true,
      isDeleted: false,
    });
    console.log("Created admin user: admin@organicstore.com / admin123");
  } else {
    console.log("Admin user already exists:", existing.email);
  }

  await mongoose.disconnect();
  console.log("Done");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
