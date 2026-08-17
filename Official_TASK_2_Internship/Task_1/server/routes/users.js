import express from "express";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret_key_change_in_production";

// Middleware to protect user routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }
    req.user = user;
    next();
  });
};

// 1. GET ALL TEAM MEMBERS
router.get("/", authenticateToken, async (req, res) => {
  try {
    const usersResult = await query(
      "SELECT id, name, email, avatar FROM users ORDER BY id ASC",
    );
    res.json(usersResult.rows);
  } catch (err) {
    console.error("Fetch Users DB Error:", err.message);
    res
      .status(500)
      .json({ message: "Could not load team members from server." });
  }
});

// 2. UPDATE USER PROFILE
router.put("/profile", authenticateToken, async (req, res) => {
  const { name, avatar } = req.body;

  // Handles JWT payloads using either req.user.id or req.user.userId
  const userId = req.user?.id || req.user?.userId || req.user?._id;

  if (!userId) {
    return res.status(400).json({ message: "User ID not found in token." });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name is required." });
  }

  try {
    const updatedUser = await query(
      `UPDATE users 
       SET name = $1, avatar = COALESCE($2, avatar) 
       WHERE id = $3 
       RETURNING id, name, email, avatar`,
      [name.trim(), avatar || null, userId],
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({
      user: updatedUser.rows[0],
      message: "Profile updated successfully!",
    });
  } catch (err) {
    console.error("Update Profile DB Error:", err.message);
    res.status(500).json({ message: "Failed to update profile." });
  }
});

export default router;
