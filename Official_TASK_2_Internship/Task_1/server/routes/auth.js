import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret_key_change_in_production";

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Check if user already exists
    const existingUser = await query("SELECT * FROM users WHERE email = $1", [
      cleanEmail,
    ]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to DB
    const newUser = await query(
      `INSERT INTO users (name, email, password) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email`,
      [name || "User", cleanEmail, hashedPassword],
    );

    const user = newUser.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      user,
      token,
      message: "Account created successfully",
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Fetch user by email
    const userResult = await query("SELECT * FROM users WHERE email = $1", [
      cleanEmail,
    ]);
    if (userResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Invalid credentials. Please try again." });
    }

    const user = userResult.rows[0];

    // 2. Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials. Please try again." });
    }

    // 3. Clean user object without password
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    // 4. Generate token
    const token = generateToken(userData);

    res.json({
      user: userData,
      token,
      message: "Sign in successful",
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

export default router;
